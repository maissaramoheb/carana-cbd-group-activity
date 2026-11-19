# CARANA Follow-up 06 — Concurrency, Latency & Resource Management Report

## 1. Mac Mini Host Constraints & Protection Design

- **Hardware:** Apple Silicon Mac mini, **24 GB Unified Memory** (`25,769,803,776` bytes), 15 CPU cores, macOS `27.2.1`.
- **Resident Model Footprint:** `gemma4:26b` (`4096` context, `llamacpp`) occupies **`18 GB`** unified RAM/VRAM (`15% CPU / 85% GPU` split) while loaded in Ollama.
- **Coexistence Requirement:** Leaving `18 GB` pinned permanently degrades heavyweight local tools (e.g., Chromium/WebKit browser sessions or desktop apps).

To balance quality (`gemma4:26b`) against the 24 GB ceiling, Follow-up 06 configures `tutor/gateway.cjs` and `tutor/provider.cjs` with:
1. **Strict Single Active Inference Slot:** Only `1` request runs inside Ollama at any moment.
2. **Bounded FIFO Wait Queue (`CARANA_MAX_QUEUE=4`, `queueTimeoutMs=45000`):** Concurrent callers receive live streaming NDJSON events (`{ type: 'queued', position, queueLength }` dynamically updating as items advance, followed by `{ type: 'started' }`). Callers beyond `maxQueue` fail immediately with `HTTP 503 OVERLOAD`. Client cancellation (`AbortSignal` / closed socket) removes queued waiters and advances remaining callers without running unnecessary inference.
3. **macOS Unified Memory Pressure Calibration (Fixed From Live Testing):** Initial testing showed Apple XNU reports `kern.memorystatus_vm_pressure_level = 2` (`WARN`) and `~0.89–1.1 GB` free/inactive reclaimable pages normally whenever `18 GB` of `gemma4:26b` weights are mapped, even while running smoothly. `defaultMemoryCheck()` originally treated `pressureLevel >= 2` as `overloaded: true`, which falsely rejected warm sequential requests after cold start. Updating the guard to `pressureLevel >= 4 || (pressureLevel >= 2 && reclaimableGB < 0.35) || reclaimableGB < 0.2` stopped all false-positive `503 MEMORY_PRESSURE` rejections while preserving protection against true `CRITICAL` (`4`) or `<0.35 GB` memory starvation (additionally unit-tested in `tests/support/pilot-ops.cjs`).
4. **Automatic Idle Model Unload (`4m` / `240000 ms`):** Both Ollama (`keep_alive: '4m'`) and a gateway idle timer (`unloadModel()` -> `keep_alive: 0`) evict `gemma4:26b` automatically after inactivity so host RAM returns to idle levels.

## 2. Live `gemma4:26b` Concurrency Benchmark Results

Executed via `tools/benchmark-concurrency.cjs` (`docs/reviews/run06-intelligent-learning/followup-06/CONCURRENCY_BENCHMARK.json`) against genuine local Ollama `gemma4:26b` (`requestTimeoutMs=90000`, `queueTimeoutMs=120000`, `maxQueue=4`, `idleUnloadMsForBenchmark=8000`):

| Scenario | Requests Sent | Completed (`200`) | Rejected (`503`) | Latency / Wall Timing | Host RAM & Pressure Snapshot |
| --- | --- | --- | --- | --- | --- |
| **Idle Baseline (Unloaded)** | — | — | — | — | `13.80 GB` reclaimable, `pressureLevel=1`, `ollama ps: []` |
| **1. Cold Start** | 1 | **1/1** (`ok=true`) | 0 | **`18,014 ms`** | `0.89 GB` reclaimable, `pressureLevel=2`, `gemma4:26b 18 GB (15%/85%)` |
| **2. 5 Sequential Warm** | 5 | **5/5** (`ok=true`) | 0 | min **`7,180 ms`**, median **`11,493 ms`**, avg **`10,315 ms`**, p95 **`12,651 ms`** (`12.7, 11.5, 7.2, 8.3, 11.9 s`) | Warm loaded cleanly (`overloaded=false`) |
| **3. 2 Concurrent** | 2 | **2/2** (`ok=true`) | 0 | Req 1: `7,891 ms` (direct); Req 2: `19,471 ms` (`queued [1]` -> `started`) | Smooth FIFO queuing |
| **4. 4 Concurrent (`1 + 3 queued`)** | 4 | **4/4** (`ok=true`) | 0 | Wall **`39,059 ms`**: `7,903 ms`, `20,925 ms [1]`, `31,864 ms [2,1]`, `39,046 ms [3,2,1]` | `1.06 GB` reclaimable, `pressureLevel=2`, `overloaded=false` |
| **5. 6-Request Overload Burst (`maxQueue=4`)** | 6 | **5/6** (`1 active + 4 queued`) | **1 (`HTTP 503 OVERLOAD`, `82 ms`)** | Wall **`56,586 ms`**: completed `9.7 s`, `23.9 s`, `38.4 s`, `47.7 s`, `56.6 s` | `0.92 GB` reclaimable, `pressureLevel=2`, `queuePeak=4`, `errors=0` |
| **6. Post-Idle Unload (`11s` after settling)** | — | — | — | Automatic `idleUnloads=1` | **`18.47 GB` reclaimable**, `pressureLevel=1`, `ollama ps: []` (`+17.55 GB` reclaimed) |

### Operational Sizing Note for Vercel Preview (`maxDuration = 60s`)
- In scenario 5, the 5th caller (`position: 4`) finished in `56,584 ms`, near Vercel's serverless function `60 s` maximum (`remote-proxy.cjs` `58 s` timeout). Keeping default gateway `queueTimeoutMs = 45,000 ms` ensures queued callers fail cleanly with a clear queue-timeout notice rather than hitting an abrupt Vercel `504`, while up to **1 active + 3 queued reviewers (~39 s)** fit comfortably inside serverless bounds.
- Overall gateway telemetry across the 17 successful benchmark inferences: **`avgLatencyMs = 10,834 ms`**, **`p95LatencyMs = 17,969 ms`** (including cold load).

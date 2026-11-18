# Run05 — backup and rollback

Versioned local backup: `/Users/maissaraselim/Library/CloudStorage/OneDrive-Personal/Consultancy/CBD E Lap/Backups/CARANA-CBD-E-Learning/2026-11-18_180217-Run05`.

Contents: all tracked source, media, curriculum, tests and evidence in source.tar.gz; complete Git refs/history in history.bundle; exact deployed static preview and routing in preview-build.tar.gz; full source SHA-256 manifest; release/backup manifests; restore.log; verification-receipt.json and SHA256SUMS.

Authoritative post-creation results are in verification-receipt.json and SHA256SUMS in that folder. Independent restore clones the bundled branch into a fresh temporary directory, checks the snapshot commit and preserved Run04tag, compares every tracked file against both the Git clone and separately extracted source archive, builds and runs the available automated suite, and verifies all80saved static asset hashes. Existing checkout and production are not reset or modified. Environment/credential files and browser profiles are excluded; real learner progress remains in its original browser origin.

Production rollback target stays on the approved Run04 deployment `dpl_DmQvvbazGm5LGjCHF8s981GqSxvR`. Main/tag4b255cb are preserved. A live production rollback was not exercised because this run did not change production. Restore source into a separate directory; do not overwrite the active checkout or browser records. Candidate application bytes are from8ddb482, while the backup snapshot additionally contains completed review evidence.

OneDrive synchronization: **NOT VERIFIED**. Local integrity/restore checks do not prove cloud synchronization.

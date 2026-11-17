# Lesson 1 release and recovery

**Promotion: HOLD.** Owner approval is required after preview acceptance. Classroom equivalence and WCAG 2.2 AA conformance are not claimed. Require a formal source/rights review, complete human listening check (pronunciation and read-along), native Safari/iOS and assistive-technology acceptance before institutional release.

- Source: dedicated branch `codex/cbd-comprehensive-enhancement`; published candidate must be reproducible from its Git commit.
- Prior custom-domain deployment: `dpl_HXHno8h1sc7E3aAPWdnNhhidVqbq`, [immutable Vercel deployment](https://carana-cbd-elearning-95qo3o3z3-delta4ce20-5830s-projects.vercel.app), served baseline corroborated with commit `9846ae7a431c769725d290a94693ad112f1bc00b`. The custom domain maps to a preview-target deployment. Do not assume a Vercel production rollback will restore this alias; inspect the alias and deployment ID before any approved traffic change. Use the Vercel project's existing alias mechanism to restore this exact prior deployment if needed and verify the custom domain, gallery, MP3s and workbench.
- Build with Node 22+ and `npm ci --offline && npm test && npm run build`. Publish only `dist/`; no runtime or build secrets and no required environment variables. Do not package the official facilitator PDF in website artifacts.
- Preview evidence and local backup manifest record the actual deployed candidate and recovery SHA.
- Existing browser state remains on its origin. Use an isolated test profile for acceptance and verify both candidate and existing aliases before approving a cutover.

## Narration release policy

The local source tracks and lock preserve the original deployed AI recordings. An authorised audio owner should listen against the exact transcript, confirm usage rights and voice provenance, then update the affected MP3 and both hashes together. Record the reason and listening reviewer in the release evidence. If the transcript changes, reject the production build until the corresponding asset has been reviewed. Never update the script hash merely to get a build to pass. Never generate or purchase audio on a normal build or without cost authorization. Full SHA-256 in deployed MP3 names makes replacements safe under immutable caching.

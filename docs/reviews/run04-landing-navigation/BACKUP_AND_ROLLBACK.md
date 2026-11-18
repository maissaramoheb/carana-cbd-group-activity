# Run 04 local backup and rollback

Backup folder: `/Users/maissaraselim/Library/CloudStorage/OneDrive-Personal/Consultancy/CBD E Lap/Backups/CARANA-CBD-E-Learning/2026-11-18_154327-Run04`.

Contents: complete tracked source archive (curriculum, media, tests and review evidence), all Git refs/history in `history.bundle`, exact deployed static preview and route configuration in `preview-build.tar.gz`, source-file SHA-256 manifest, release manifest, backup manifest, restore verification receipt and SHA256SUMS.

Authoritative post-creation results: `verification-receipt.json` and `SHA256SUMS` in that folder. The independent restore procedure clones only the bundled Git history into a fresh temporary directory, verifies the snapshot commit and preserved release tag, compares every tracked file SHA-256 with the archived source, then builds and runs the available automated suite. It also extracts and verifies every asset in the saved preview build. No network or existing checkout is needed for the restore build/tests. Excluded: untracked environment/credential files and browser profile data; actual learner records remain in their original browser origins.

Production rollback target remains `dpl_FKmppXAgkJATUktzaGntRSi6c968`, associated with the existing Run03B release. This run did not exercise a live rollback because production was not changed. The preserved bundle can reconstruct the baseline and the review branch. Do not reset the working checkout or overwrite learner state; restore into a separate directory.

OneDrive synchronization is **NOT VERIFIED**. Successful local archive checks do not establish cloud synchronization.

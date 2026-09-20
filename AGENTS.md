# PartnerHub contribution guide

## Repository baseline

- PartnerHub is a fresh rebuild. Do not copy application code or Git history from the earlier PBL-Himti project.
- Keep the product identity focused on event and sponsorship coordination.
- Do not add prompts, fields, schemas, or UI labels that ask for a person's name or assign a user role unless a future product decision explicitly requires them.

## Git workflow

- Before changing code, run `git pull --ff-only origin main` (or pull the current base branch) and inspect the working tree.
- Work on a feature branch. The current delivery branch is `adin`.
- Keep commits focused and verify the result before pushing.
- Never force-push unless the user explicitly requests history replacement.

## README and assets

- Document only behavior and tooling verified in this repository.
- Do not invent screenshots, metrics, URLs, architecture, or test results.
- Keep visual assets in a clear repository path and reference only files that exist.
- Preserve the visual direction of the earlier project: geometric marks, restrained blue and cyan accents, and clean technical presentation.

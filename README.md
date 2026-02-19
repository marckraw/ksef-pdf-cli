# ksef-pdf-cli

Bun/Turbo wrapper repository that ships a cross-platform CLI executable for KSeF PDF generation.

## Repository Layout

- `apps/cli` - CLI app (`ksef-pdf convert ...`)
- `packages/ksef-pdf-generator` - git submodule pointing to the forked library (`marckraw/ksef-pdf-generator`)

## Requirements

- Bun `1.1.34+`
- Git (with submodule support)

## Setup

```bash
git clone <this-repo-url>
cd ksef-pdf-cli
git submodule update --init --recursive
bun install
```

## CLI Usage

```bash
bun run apps/cli/src/main.ts --help
```

Convert invoice XML:

```bash
bun run apps/cli/src/main.ts convert --input ./invoice.xml --nr-ksef 1234567890-20260101-ABCDEFGH
```

Convert UPO XML:

```bash
bun run apps/cli/src/main.ts convert --input ./upo.xml
```

Write base64 to stdout:

```bash
bun run apps/cli/src/main.ts convert --input ./invoice.xml --nr-ksef ... --stdout-base64
```

## Build Single Executables

```bash
bun run compile:linux-x64
bun run compile:windows-x64
bun run compile:darwin-arm64
```

Artifacts are written to `dist/`.

## Upstream Sync Flow

Fork repository sync (run in fork repo):

```bash
git fetch upstream
git checkout main
git merge upstream/main
git push origin main
```

Then in this wrapper repo update the submodule pointer:

```bash
./scripts/sync-submodule.sh
git add packages/ksef-pdf-generator
git commit -m "chore: bump ksef-pdf-generator submodule"
```

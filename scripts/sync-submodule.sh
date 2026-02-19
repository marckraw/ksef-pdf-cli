#!/usr/bin/env bash
set -euo pipefail

git submodule update --init --recursive

git -C packages/ksef-pdf-generator fetch origin main
git -C packages/ksef-pdf-generator checkout main
git -C packages/ksef-pdf-generator pull --ff-only origin main

git add packages/ksef-pdf-generator

echo "Submodule updated to:"
git -C packages/ksef-pdf-generator rev-parse --short HEAD

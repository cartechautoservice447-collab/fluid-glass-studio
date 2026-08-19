#!/usr/bin/env bash
set -euo pipefail

PWA_URL="${PWA_URL:-https://fluid-glass-studio.lovable.app}"
OUT_DIR="${OUT_DIR:-release}"

npm install --global @bubblewrap/cli@1.25.0
rm -rf android-twa
mkdir -p android-twa
bubblewrap init --manifest="${PWA_URL}/manifest.webmanifest" --directory=android-twa
cd android-twa
bubblewrap build
mkdir -p "../${OUT_DIR}"
cp app-release-signed.apk "../${OUT_DIR}/Liquid Glass Studio.apk"
cp app-release-bundle.aab "../${OUT_DIR}/Liquid Glass Studio.aab"

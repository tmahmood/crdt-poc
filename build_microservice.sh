#!/usr/bin/env bash

cd web-server-wasm || exit
wasm-pack build --release web-server-wasm
cd ../crr_poc/crr_poc || exit
npm run build
cp -r dist ../../build




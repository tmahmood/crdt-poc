#!/usr/bin/env bash

mkdir -p build/files/

cd web-server-wasm || exit
wasm-pack build --release
cd ../crr_poc || exit
npm run build
rm -rf ../build/files/www
cp -r dist ../build/files/www

cd ../server || exit
cargo build --release
cp target/release/server ../build/files/

cd ../
if [ -d static-web-server ]; then
  cd static-web-server || exit
  git pull
else
  git clone https://github.com/static-web-server/static-web-server/
  cd static-web-server || exit
fi
cargo build --release
cp target/release/static-web-server ../build/files/sws
cd ../

cp tpl/* build/
mv build/entry_point.sh build/files/

cd ../ | exit
if [ -f "tmahmood.pem" ]; then
  rsync -e 'ssh -i tmahmood.pem' -r wasm-dev/build/ ubuntu@godly.dev:todo-in-browser
else
  echo "Check directory"
fi

#!/usr/bin/env bash

APP_NAME="crr_poc"
ROOT_DIR=$(pwd)
BUILD_DIR_APP=$ROOT_DIR/build/$APP_NAME
BUILD_FILES=$ROOT_DIR/build/$APP_NAME/files
SRC_DIR_APP=$ROOT_DIR/$APP_NAME
SRC_DIR_SERVER=$ROOT_DIR/server
SRC_DIR_SWS=$ROOT_DIR/static-web-server
TPL_DIR=$ROOT_DIR/tpl

echo "Building app: $SRC_DIR_APP"
mkdir -p "$BUILD_FILES"


echo "Building web app"
cd "$SRC_DIR_APP" || exit
npm run build
rm -rf "$BUILD_DIR_APP"/www
cp -r dist "$BUILD_FILES"/www

echo "Building server"
cd "$SRC_DIR_SERVER" || exit
cargo build --release
cp target/release/server "$BUILD_FILES"

if [ -d "$SRC_DIR_SWS" ]; then
  cd "$SRC_DIR_SWS" || exit
  git checkout master
  git pull
else
  git clone https://github.com/static-web-server/static-web-server/
  cd "$SRC_DIR_SWS" || exit
fi
cargo build --release
cp target/release/static-web-server "$BUILD_FILES"/sws

cp -r "$TPL_DIR"/* "$BUILD_DIR_APP"
mv "$BUILD_DIR_APP"/entry_point.sh "$BUILD_FILES"

cd "$ROOT_DIR" || exit

if [ "$PROD" == "1" ] || [ -n "$PROD" ]; then
  echo "!! UPLOADING TO PRODUCTION SERVER !!"
  cd ../ || exit
  pwd
  if [ -f "tmahmood.pem" ]; then
    echo "Uploading ..."
    rsync -e 'ssh -i tmahmood.pem' -r "$BUILD_FILES" ubuntu@godly.dev:todo-in-browser
  else
    echo "Check directory"
  fi
  cd "$ROOT_DIR" || exit
fi
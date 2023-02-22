#!/usr/bin/env bash

APP_NAME="sw-db-poc"

docker stop $APP_NAME.godly.dev
docker rm $APP_NAME.godly.dev

docker build . -t $APP_NAME.godly.dev

docker run -v godly.dev-certbot-www:/var/www/certbot \
  -v godly.dev-certbot-etc:/etc/letsencrypt \
  --rm godly.dev-certbot certonly -n --keep --webroot --webroot-path /var/www/certbot/ \
  -d $APP_NAME.godly.dev --register-unsafely-without-email --agree-tos || exit 1
docker cp ./$APP_NAME.godly.dev.conf godly.dev-reverse-proxy:/etc/nginx/sites-enabled-docker/

docker run -p 80 -p 9000 -d --name $APP_NAME.godly.dev --network=godly.dev-network $APP_NAME.godly.dev
docker exec -it godly.dev-reverse-proxy nginx -s reload

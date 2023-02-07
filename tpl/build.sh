#!/usr/bin/env bash

docker stop todo-in-browser.godly.dev
docker rm todo-in-browser.godly.dev

docker build . -t todo-in-browser.godly.dev

docker run -v godly.dev-certbot-www:/var/www/certbot -v godly.dev-certbot-etc:/etc/letsencrypt --rm godly.dev-certbot certonly -n --keep --webroot --webroot-path /var/www/certbot/ -d todo-in-browser.godly.dev --register-unsafely-without-email --agree-tos || exit 1
docker cp ./todo-in-browser.godly.dev.conf godly.dev-reverse-proxy:/etc/nginx/sites-enabled-docker/

docker run -p 80 -p 9000 -d --name todo-in-browser.godly.dev --network=godly.dev-network 'todo-in-browser.godly.dev'
docker exec -it godly.dev-reverse-proxy nginx -s reload

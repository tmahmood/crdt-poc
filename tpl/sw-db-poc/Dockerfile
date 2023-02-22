FROM archlinux:latest

EXPOSE 80
WORKDIR /app
COPY ./public ./public
COPY sws ./
COPY sws.toml ./
COPY entry_point.sh ./
CMD sh entry_point.sh


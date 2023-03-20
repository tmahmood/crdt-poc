# CRDT Proof of concept

Proof of concept build for in-browser replicable database


## How to build

```shell

make all
```

This will just build the project for deployment. It is deployed in our automated container system

```shell

make run
```

This will build the project for deployment, and run static web server to serve the app


## Relay server

`server` is the relay server built using `stateroom`, this maintains communication between clients to keep the database synced.

## Deploying

After uploading the `build/crr_poc` to server that is running automated container system, executing `build.sh` will 
1. build the docker container, 
2. Register it's subdomain
3. Update internal DNS
4. Start the container

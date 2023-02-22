#!/bin/bash

curl -X POST godly.dev-record-create/create -H 'Content-Type: application/json' -d '{ "name": "sw-db-poc.godly.dev" }'
./sws -w sws.toml

#!/bin/bash

curl -X POST godly.dev-record-create/create -H 'Content-Type: application/json' -d '{ "name": "todo-in-browser.godly.dev" }'
./server &
./sws -w sws.toml &
wait -n
exit $?

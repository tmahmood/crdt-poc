# Relay server for CRDT database

This server acts as relay for in browser replicated database

When a client connects, server sends a `send_all` message to the client, it also asks the oldest client for all the changes it has.

## On new client connection
Once it receives all the changes from the old client, it will send the changes to the new client. Also when it receives all the changes from the new client it will send it to all the connected clients. This way we now have all the data synced accros the clients.

## On data change
Whenever any client has changed data, it will send it to the server, and the server will broadcast the data to every connected client. This way we always have the data synced between clients

CRDT ensures, there are no conflicts. And we will always have synced data.

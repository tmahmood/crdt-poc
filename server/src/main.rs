const DATABASE_URL: &str = "sqlite:todos.db";

use std::cmp::max;
use std::fs::File;
use serde::{Deserialize, Serialize};
use sqlx::sqlite::{SqlitePool};
use stateroom::{ClientId, MessageRecipient, SimpleStateroomService, StateroomContext};
use stateroom_server::*;

#[derive(Deserialize, Serialize, Debug)]
enum MessageKind {
    Version,
    ChangeSet,
    ACK,
}

#[derive(Deserialize, Serialize, Debug)]
struct RecvMessageData {
    kind: MessageKind,
    message: String,
    client: Option<u32>,
}

impl RecvMessageData {
    pub fn new(kind: MessageKind, message: String, client: Option<ClientId>) -> Self {
        Self { kind, message, client: client.and_then(|v| Some(v.0)) }
    }
}

#[derive(Deserialize, Serialize, Debug)]
struct SendMessageData {
    command: String,
    version: Option<String>,
    client: Option<u32>,
    message: Option<String>,
}

impl SendMessageData {
    pub fn new(command: &str, version: Option<&str>, client: Option<ClientId>, message: Option<String>) -> Self {
        SendMessageData {
            command: command.to_string(),
            version: version.and_then(|v| Some(v.to_string())),
            client: client.and_then(|v| Some(v.0)),
            message,
        }
    }
}

#[derive(Clone)]
struct SharedCounterServer {
    changes: Vec<String>,
    latest_version: i32,
    client: ClientId,
    all_clients: Vec<ClientId>,
    latest_changeset: String,
}

impl Default for SharedCounterServer {
    fn default() -> Self {
        SharedCounterServer {
            changes: vec![],
            latest_version: 0,
            client: ClientId(0),
            all_clients: vec![],
            latest_changeset: "".to_string(),
        }
    }
}

impl SimpleStateroomService for SharedCounterServer {
    fn new(_: &str,
           _: &impl StateroomContext) -> Self {
        SharedCounterServer::default()
    }

    fn connect(&mut self, client: ClientId, ctx: &impl StateroomContext) {
        self.all_clients.push(client);
        let msg = SendMessageData::new(
            "send_all",
            None,
            None,
            None,
        );
        ctx.send_message(client, &serde_json::to_string(&msg).unwrap());
        println!("{:?}", self.all_clients);
        let first_client = self.all_clients.first().unwrap();
        if first_client.0 != client.0 {
            println!("Sending data from: {} -> {}", first_client.0, client.0);
            let msg = SendMessageData::new(
                "send_all",
                None,
                Some(client),
                None,
            );
            ctx.send_message(*first_client, &serde_json::to_string(&msg).unwrap());
        }
    }

    fn disconnect(&mut self, client: ClientId, context: &impl StateroomContext) {
        if let Ok(idx) = self.all_clients.binary_search(&client) {
            self.all_clients.remove(idx);
            println!("{:?}", self.all_clients);
        }
    }

    fn message(&mut self, cid: ClientId, _message: &str, ctx: &impl StateroomContext) {
        let message = _message.trim();
        println!("{}", message);
        let message_data: RecvMessageData = match serde_json::from_str(message) {
            Ok(d) => d,
            Err(e) => {
                println!("{e}");
                return;
            }
        };

        match message_data.kind {
            MessageKind::Version => {
                let i: i32 = message_data.message.parse().unwrap();
                if i >= self.latest_version {
                    self.latest_version = i;
                    let s = SendMessageData::new(
                        "send",
                        Some(&self.latest_version.to_string()),
                        None,
                        None,
                    );
                    ctx.send_message(cid, &serde_json::to_string(&s).unwrap());
                }
            }
            MessageKind::ChangeSet => {

                let msg = SendMessageData::new(
                    "apply", None, None, Some(message_data.message));
                let m = serde_json::to_string(&msg).unwrap();
                println!("{:?}", msg);
                if let Some(client) = message_data.client {
                    println!("should I be here?");
                    ctx.send_message(
                        ClientId(client),
                        &m);
                } else {
                    ctx.send_message(
                        MessageRecipient::Broadcast,
                        &m);
                }
            }
            MessageKind::ACK => {
                println!("ACK: {:?} {}", cid, message_data.message);
            }
        }
    }
}

#[actix::main]
async fn main() -> std::io::Result<()> {
    Server::new()
        .with_port(9000)
        .serve_async(SharedCounterServer::default()).await.unwrap();
    Ok(())
}
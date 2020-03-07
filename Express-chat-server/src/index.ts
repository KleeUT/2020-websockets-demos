import express from "express";
import http from "http";
import WebSocket from "ws";

const port = 8080;

const app = express();
const server = http.createServer(app);
const socketServer = new WebSocket.Server({ server });
const sockets: Array<{
  id: number;
  socket: WebSocket;
  sent: number;
  received: number;
}> = [];
socketServer.on("connection", (socket: WebSocket) => {
  const id = Math.random();
  sockets.push({ id, socket, sent: 0, received: 0 });

  const removeSocket = () => {
    sockets.splice(
      sockets.findIndex(x => x.id === id),
      1
    );
    console.log("Closed");
  };
  
  socket.on("close", removeSocket);

  socket.on("message", (message: WebSocket.Data) => {
    console.log(`received ${message}`);
    // Use the server to track all the connections
    // socketServer.clients.forEach((socket:WebSocket) => {
    //     socket.send(message);
    // });
    sockets.forEach(sock => {
      if (sock.id !== id) {
        try {
          sock.received += 1;
          sock.socket.send(message);
        } catch {
          removeSocket();
        }
      } else {
        sock.sent += 1;
      }
    });
  });

  socket.send("Thanks for connecting to my server");
});

server.listen(port, () => console.log(`listening on port: ${port}`));

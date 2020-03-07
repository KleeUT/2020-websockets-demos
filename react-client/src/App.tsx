import React, { useState } from "react";
import logo from "./logo.svg";
import "./App.css";

let socket: WebSocket | null = null;
const connectLocal = ({
  setMessage
}: {
  setMessage: React.Dispatch<React.SetStateAction<string>>;
}) => connect({ url: "ws://localhost:8080", setMessage });
const connectAPIGateway = ({
  setMessage
}: {
  setMessage: React.Dispatch<React.SetStateAction<string>>;
}) =>
  connect({
    url: "wss://jug56lnyeh.execute-api.ap-southeast-2.amazonaws.com/v1",
    setMessage
  });

const connect = ({
  url,
  setMessage
}: {
  url: string;
  setMessage: React.Dispatch<React.SetStateAction<string>>;
}) => {
  // Create a new Websocket
  socket = new WebSocket(url);

  // Set behaviour based on events
  socket.onopen = (e: Event) => {
    setMessage("Connected");
  };
  socket.onclose = (e: Event) => {
    setMessage("Disconnected");
  };
  socket.onmessage = (event: MessageEvent) => {
    setMessage(event.data);
  };
};

// Send message, if socket assigned
const sendMessage = (messageToSend: string) => {
  try {
    socket?.send(messageToSend);
  } catch (e) {
    // handle errors sending
    console.log(e);
  }
};

// React code, not relevant for WebSockets
const App = () => {
  const [message, setMessage] = useState("Uninitialised");
  const [messageToSend, setMessageToSend] = useState("");
  return (
    <div className="App">
      <header className="App-header">
        <h1>Web Socket Test</h1>
        <div>
          <button onClick={() => connectLocal({ setMessage })}>
            Connect Local
          </button>
          <button onClick={() => connectAPIGateway({ setMessage })}>
            Connect API GW
          </button>
        </div>
        <div>
          <button onClick={() => socket?.close()}>Close</button>
        </div>
        <div className="sendMessageBlock">
          <input
            type="text"
            value={messageToSend}
            onChange={e => setMessageToSend(e.target.value)}
          />
          <button onClick={() => sendMessage(messageToSend)}>Send</button>
        </div>
        <h2>Message</h2>
        <p>{message}</p>
      </header>
    </div>
  );
};

export default App;

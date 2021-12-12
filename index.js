const express = require("express");
const cors = require("cors");
const app = express();
const http = require("http");
const server = http.createServer(app);

// Create socket.io server
const { Server } = require("socket.io");
const io = new Server(server, {
  cors: { origin: "http://localhost:3000", methods: ["GET", "POST"] },
});

app.use(cors());

io.on("connection", (socket) => {
  let socketName = socket.handshake.query.serverName || socket.id;
  let socketType = socket.handshake.query.socketType;

  if (socketType === "client") {
    socket.join("clients");
    if (io.sockets.adapter.rooms.get("clients")) {
      io.to("servers").emit(
        "clientcount",
        io.sockets.adapter.rooms.get("clients").size
      );
    }

    socket.on("disconnect", (socket) => {
      if (io.sockets.adapter.rooms.get("clients")) {
        io.to("servers").emit(
          "clientcount",
          io.sockets.adapter.rooms.get("clients").size
        );
      } else {
        io.to("servers").emit("clientcount", 0);
      }
    });
  } else if (socketType === "server") {
    socket.join("servers");
    socket.on("disconnect", (socket) => {
      io.to("clients").emit("disconnectserver", socketName);
    });
  }

  socket.on("volumedata", (data) => {
    io.emit("volumedata", data);
  });
});

server.listen(5000, () => {
  console.log("Server is listening on 5000");
});

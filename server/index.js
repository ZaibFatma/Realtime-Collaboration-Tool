const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// 🧠 Temporary storage for drawing data
const drawingData = [];

io.on("connection", (socket) => {
  console.log("New user connected");

  // ✅ Receive and store username
  socket.on("join", (username) => {
    socket.username = username;
    console.log(`${username} joined`);
  });

  // ✅ Send stored drawing to new user
  socket.emit("load-drawing", drawingData);

  // ✅ Receive and broadcast new drawing
  socket.on("draw", (data) => {
    drawingData.push(data);               // Store drawing
    socket.broadcast.emit("draw", data);  // Send to others
  });

  // ✅ Chat messages
  socket.on("chat-message", (data) => {
    io.emit("chat-message", data);  // Send to all clients
  });

  // ✅ Handle clear canvas
  socket.on("clear-canvas", () => {
    drawingData.length = 0;         // Clear the stored drawing
    io.emit("clear-canvas");        // Tell all clients to clear
    console.log("Canvas cleared by", socket.username || "user");
  });

  // ✅ Handle disconnect
  socket.on("disconnect", () => {
    console.log(`${socket.username || "A user"} disconnected`);
  });
});

// ✅ Start the server
server.listen(3000, () => {
  console.log("Server running at http://localhost:3000");
});

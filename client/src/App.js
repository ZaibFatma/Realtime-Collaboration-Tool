import React, { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';
import './App.css';

const socket = io('http://localhost:3000');

function App() {
  const canvasRef = useRef(null);
  const isDrawing = useRef(false);
  const [username, setUsername] = useState('');
  const [message, setMessage] = useState('');
  const [chat, setChat] = useState([]);
  const [color, setColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(3);

  // ✅ Only run once: prompt for username
  useEffect(() => {
    const name = prompt("Enter your name:");
    setUsername(name);
    socket.emit("join", name);
  }, []);

  // 🎨 Canvas + socket setup
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    canvas.width = window.innerWidth - 300;
    canvas.height = window.innerHeight - 100;

    // Load previous drawing
    socket.on("load-drawing", (drawings) => {
      drawings.forEach(({ x, y, color, brushSize }) => {
        drawOnCanvas(x, y, ctx, color, brushSize);
      });
    });

    // Receive real-time drawing
    socket.on("draw", ({ x, y, color, brushSize }) => {
      drawOnCanvas(x, y, ctx, color, brushSize);
    });

    // Chat messages
    socket.on("chat-message", (data) => {
      setChat((prev) => [...prev, data]);
    });

    // Clear canvas event
    socket.on("clear-canvas", () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    });

    const startDrawing = (e) => {
      isDrawing.current = true;
      draw(e);
    };

    const endDrawing = () => {
      isDrawing.current = false;
      ctx.beginPath();
    };

    const draw = (e) => {
      if (!isDrawing.current) return;
      const x = e.clientX - canvas.offsetLeft;
      const y = e.clientY - canvas.offsetTop;
      drawOnCanvas(x, y, ctx, color, brushSize);
      socket.emit("draw", { x, y, color, brushSize, username });
    };

    canvas.addEventListener("mousedown", startDrawing);
    canvas.addEventListener("mouseup", endDrawing);
    canvas.addEventListener("mousemove", draw);

    return () => {
      canvas.removeEventListener("mousedown", startDrawing);
      canvas.removeEventListener("mouseup", endDrawing);
      canvas.removeEventListener("mousemove", draw);
    };
  }, [color, brushSize]);

  const drawOnCanvas = (x, y, ctx, color = "#000", size = 3) => {
    ctx.lineWidth = size;
    ctx.lineCap = "round";
    ctx.strokeStyle = color;
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const sendMessage = () => {
    if (message.trim()) {
      socket.emit("chat-message", { username, message });
      setMessage('');
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    socket.emit("clear-canvas");
  };

  return (
    <div style={{ display: "flex" }}>
      {/* Sidebar */}
      <div style={{
        width: "300px", padding: "10px", borderRight: "2px solid #ccc",
        height: "100vh", overflowY: "auto"
      }}>
        <h3>🖌️ Controls</h3>

        <label>Color:</label>
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          style={{ width: "100%" }}
        />

        <label>Brush Size:</label>
        <input
          type="range"
          min="1"
          max="20"
          value={brushSize}
          onChange={(e) => setBrushSize(Number(e.target.value))}
          style={{ width: "100%" }}
        />

        <button
          onClick={clearCanvas}
          style={{
            width: "100%", marginTop: "10px",
            background: "#f66", color: "#fff", fontWeight: "bold"
          }}>
          🧽 Clear Whiteboard
        </button>

        <hr />

        <h3>💬 Chat</h3>
        <div style={{
          maxHeight: "40vh", overflowY: "auto", marginBottom: "10px",
          border: "1px solid #ccc", padding: "5px"
        }}>
          {chat.map((msg, idx) => (
            <div key={idx}><b>{msg.username}:</b> {msg.message}</div>
          ))}
        </div>
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type message..."
          style={{ width: "100%", padding: "5px", marginBottom: "5px" }}
        />
        <button onClick={sendMessage} style={{ width: "100%" }}>Send</button>
      </div>

      {/* Canvas */}
      <canvas
        id="canvas"
        ref={canvasRef}
        style={{ border: "2px solid #ccc", margin: "10px" }}
      />
    </div>
  );
}

export default App;

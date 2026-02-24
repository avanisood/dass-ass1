const io = require("socket.io-client");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
require('dotenv').config();

// Create a dummy token for the test
const token = jwt.sign({ id: new mongoose.Types.ObjectId(), role: 'participant' }, process.env.JWT_SECRET || 'fallback-secret');

const socket = io("http://localhost:5000", {
    auth: { token },
    transports: ["websocket", "polling"],
});

socket.on("connect", () => {
    console.log("Socket connected:", socket.id);
    // Join a dummy event
    socket.emit("join_event", "12345");

    // Pretend backend emits a message to this room
    setTimeout(async () => {
        try {
            const resp = await require('axios').post('http://localhost:5000/api/health'); // Just to verify axis works, no real need
            console.log('Test logic checking...');
        } catch (e) {
            console.log('Error:', e.message);
        }
    }, 1000);
});

socket.on("new_message", (msg) => {
    console.log("Received new_message:", msg);
});

socket.on("connect_error", (err) => {
    console.log("Connection error:", err.message);
});

setTimeout(() => {
    console.log("Test finished.");
    process.exit(0);
}, 3000);

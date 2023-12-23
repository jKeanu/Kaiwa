const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const User = require('../models/userModel')

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3002',
    methods: ['GET', 'POST'],
  },
});


// Manage connections
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);
  socket.on("join_room", (data)=>{
    socket.join(data)
  })
  //Listen for messages
  socket.on('send_message', (data) => {
    //Send a message to all clients connected to a Socket.IO server except the sender.
    socket.to(data.room).emit('receive_message', data.inputMessage);
  });
});

server.listen(3001, () => {
  console.log('Server is running on http://localhost:3001');
});


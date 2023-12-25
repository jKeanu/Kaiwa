const express = require('express');
const jwt = require('jsonwebtoken')
const Redis = require('redis')
const http = require('http');
const { Server } = require('socket.io');
const {promisify} = require('util')
const User = require('../models/userModel')
const Chat = require('../models/chatModel')


const app = express();
const server = http.createServer(app);

const redisClient = Redis.createClient();
redisClient.on('error', (err) => console.log('Redis Client Error', err));
redisClient.connect();

const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3002',
    methods: ['GET', 'POST'],
  },
});


const getUserIdFromSocket = async (token)=> {
  try {
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
    return decoded.id;
  } catch (error) {
    return null;
  }
}

// Manage connections
io.on('connection', async (socket) => {
  const userId = getUserIdFromSocket(socket.handshake.query.token)
  await redisClient.incr(`user:${userId}:connections`)
  const userConnection = await redisClient.incr(`user:${userId}:connections`);

  if(userConnection===1){
    await User.findByIdAndUpdate(userId, { status: "online" });
  }

  socket.on("join_room", (channelId)=>{
    socket.join(channelId)
  })

  socket.on('disconnect', async ()=>{
    await redisClient.decr(`user:${userId}:connections`, async (err, newCount)=>{
      if (newCount<=0){
        await User.findByIdAndUpdate(userId, {status:"offline"})
        await redisClient.del(`user:${userId}:connections`);
      }
    })
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


const jwt = require('jsonwebtoken')
const Redis = require('redis')
const { Server } = require('socket.io');
const {promisify} = require('util')
const User = require('./models/userModel')
const Chat = require('./models/chatModel');
const Channel = require('./models/channelModel');
const { type } = require('os');


const redisClient = Redis.createClient();
redisClient.on('error', (err) => console.log('Redis Client Error', err));
redisClient.connect();

const getUserIdFromSocket = async (token)=> {
  try {
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
    return decoded.id;
  } catch (error) {
    return null;
  }
}

// Manage connections

module.exports = (httpServer) =>{
  const io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', async (socket) => {
    const userId = await getUserIdFromSocket(socket.handshake.query.token)
    
    redisClient.incr(`user:${userId}:connections`, (err, newCount) => {
      if (!err) {
        if (newCount === 1) {
          // User was not previously connected, set status to "online"
          User.findByIdAndUpdate(userId, { status: "Online" }, (updateErr) => {
            if (updateErr) {
              console.error('Error updating user status:', updateErr);
            }
          });
        }
      } else {
        console.error('Error incrementing connection count in Redis:', err);
      }
    });
  
    socket.on("joinRoom", (channelNumber)=>{
      socket.join(channelNumber)
    })
    
    socket.on('leaveRoom', (channelNumber)=>{
      socket.leave(channelNumber)
    })
  
    //Listen for messages
    socket.on('send_message', async (data) => {
      const newMessage = await Chat.create({
        sender: userId,
        channel: data.channelId,
        content: data.content,
        time:data.time
  })
  
    //Update the last message of the channel
    await Channel.findByIdAndUpdate(
        {_id:data.channelId},
        {lastMessage:data.time})
    //Although the newMessage document consists of sender as a mongoose object id,
    //we can use spread operator and add a similar key to overwrite it.
    const senderInfo = {
      time:newMessage.time,
      content:newMessage.content,
      sender:{
        displayName:data.displayName,
        image:data.image
      }
    }
    socket.to(data.channelNumber).emit('receive_message', senderInfo);
    });
    socket.on('disconnect', async ()=>{
      await redisClient.decr(`user:${userId}:connections`, async (err, newCount)=>{
        if (newCount<=0){
          await User.findByIdAndUpdate(userId, {status:"Offline"})
          await redisClient.del(`user:${userId}:connections`);
        }
      })
    })
  });
  
}


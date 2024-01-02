const jwt = require('jsonwebtoken')
const Redis = require('redis')
const { Server } = require('socket.io');
const {promisify} = require('util')
const User = require('./models/userModel')
const Chat = require('./models/chatModel');
const Channel = require('./models/channelModel');


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
    const userConnection = await redisClient.incr(`user:${userId}:connections`);
  
    if(userConnection===1){
      await User.findByIdAndUpdate(userId, { status: "online" });
    }
  
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
    socket.to(data.channelNumber).emit('receive_message', {
      ...newMessage,
      sender:{
        displayName:data.displayName,
        image:data.image
      }
    });
    });
    socket.on('disconnect', async ()=>{
      await redisClient.decr(`user:${userId}:connections`, async (err, newCount)=>{
        if (newCount<=0){
          await User.findByIdAndUpdate(userId, {status:"offline"})
          await redisClient.del(`user:${userId}:connections`);
        }
      })
    })
  });
  
}


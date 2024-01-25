import jwt from 'jsonwebtoken';
import Redis from 'redis';
import { Server } from 'socket.io';
import { promisify } from 'util';
import User from './models/userModel.js';
import Chat from './models/chatModel.js';
import Channel from './models/channelModel.js';

const redisClient = Redis.createClient();
redisClient.on('error', (err) => console.log('Redis Client Error', err));
redisClient.connect();

const getUserIdFromSocket = async (token) => {
  try {
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
    return decoded.id;
  } catch (error) {
    console.log(error)
    return null;
  }
};

// Manage connections
export default (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', async (socket) => {
    const verifiedCurrentUserId = await getUserIdFromSocket(socket.handshake.query.token);
    let newCount = await redisClient.incr(`user:${verifiedCurrentUserId}:connections`)

    socket.on('joinRoom', (channelNumber) => {
      socket.join(channelNumber);
    });

    socket.on('liveUpdates', (userId)=>{
      socket.join(`user-${userId}`)
    })

    socket.on('leaveRoom', (channelNumber) => {
      socket.leave(channelNumber);
    });

    socket.on('leaveLiveUpdates', (userId)=>{
      socket.leave(`user-${userId}`)
    })


    // Listen for messages
    socket.on('send_message', async (data) => {
      await Chat.create({
        sender: verifiedCurrentUserId,
        channel: data.channel,
        content: data.content,
        time: data.time,
        formattedDate: data.formattedDate
      });
      // Update the last message of the channel
      await Channel.findByIdAndUpdate(
        { _id: data.channel },
        { lastMessage: data.time }
      );
      // Although the newMessage document consists of sender as a mongoose object id,
      // we can use spread operator and add a similar key to overwrite it.
      const messageInfo = {
        time: data.time,
        content: data.content,
        channel:data.channel,
        sender: data.sender,
        formattedDate: data.formattedDate
      };
      
      data.members.forEach(memberId=>{
        io.to(`user-${memberId}`).emit(`channel_lastmsg_update`,
         {channelId:data.channel, channelNumber:data.channelNumber,
          newTime:data.time, message:messageInfo})
      })
      socket.to(data.channelNumber).emit('receive_message', messageInfo);
    });

    socket.on('user_invite_success', async(data)=>{
      //add status on select, if status is already implemented ------------------------------
      const invitedUser = await User.findById(data.inviteUser).select('displayName friendTag _id photo')
      data.members.forEach(memberId=>{
        io.to(`user-${memberId}`).emit('channel_new_member_update',
         {invitedUser, channelNumber:data.channelNumber})
      })
    })

    socket.on("continue_message", async(data)=>{
      const updatedMessage = await Chat.findOneAndUpdate(
        {channel:data.channel, sender:verifiedCurrentUserId, time:data.prevTime},
        {time:data.newTime, $push:{content:data.content}},
           {new:true})

      await Channel.findByIdAndUpdate(data.channel, {lastMessage:data.newTime})     
      //Since we need the sender details, we cannot just pass the updatedMessage
      //directly to the receive_message, the only sender info we have on chat model is the id      
      const messageInfo = {
        time: updatedMessage.time,
        sender:data.sender,
        content: updatedMessage.content,
        channel: updatedMessage.channel,
        formattedDate: updatedMessage.formattedDate,
        updated:true,
      }
      socket.to(data.channelNumber).emit('receive_message', messageInfo)
      data.members.forEach(memberId=>{
        io.to(`user-${memberId}`).emit(`channel_lastmsg_update`, 
        {channelId:updatedMessage.channel, channelNumber:data.channelNumber,
          newTime:updatedMessage.time, message:messageInfo})
      })
    })

    socket.on('disconnect', async () => {

    });
  });
};
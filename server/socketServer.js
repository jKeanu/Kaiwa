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
    const userId = await getUserIdFromSocket(socket.handshake.query.token);
    redisClient.incr(`user:${userId}:connections`, (err, newCount) => {
      if (!err) {
        if (newCount === 1) {
          // User was not previously connected, set status to "online"
          User.findByIdAndUpdate(userId, { status: 'Online' }, (updateErr) => {
            if (updateErr) {
              console.error('Error updating user status:', updateErr);
            }
          });
        }
      }else {
        console.error('Error incrementing connection count in Redis:', err);
      }
    });

    socket.on('joinRoom', (channelNumber) => {
      socket.join(channelNumber);
    });

    socket.on('leaveRoom', (channelNumber) => {
      socket.leave(channelNumber);
    });

    // Listen for messages
    socket.on('send_message', async (data) => {
      await Chat.create({
        sender: userId,
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
      socket.to(data.channelNumber).emit('receive_message', messageInfo);
    });

    socket.on("continue_message", async(data)=>{
      console.log(data.channel, userId, data.time, '---------')
      const updatedMessage = await Chat.findOneAndUpdate(
        {channel:data.channel, sender:userId, time:data.time},
        {$push:{content:data.content}},
           {new:true})
      //Since we need the sender details, we cannot just pass the updatedMessage
      //directly to the receive_message, the only sender info we have on chat model is the id
      const messageInfo = {
        time: updatedMessage.time,
        sender:data.sender,
        content: updatedMessage.content,
        channel: updatedMessage.channel,
        formattedDate: updatedMessage.formattedDate,
        updated:true
      }
      socket.to(data.channelNumber).emit('receive_message', messageInfo)
    })

    socket.on('disconnect', async () => {
      await redisClient.decr(`user:${userId}:connections`, async (err, newCount) => {
        if (newCount <= 0) {
          await User.findByIdAndUpdate(userId, { status: 'Offline' });
          await redisClient.del(`user:${userId}:connections`);
        }
      });
    });
  });
};
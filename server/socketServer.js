import jwt from 'jsonwebtoken';
import { Server } from 'socket.io';
import { promisify } from 'util';
import User from './models/userModel.js';
import Chat from './models/chatModel.js';
import Channel from './models/channelModel.js';
import mongoose from 'mongoose';
import winston from 'winston';
import WinstonCloudWatch from 'winston-cloudwatch'
import { Redis } from 'ioredis';
import 'dotenv/config.js' //Since socket server is not directly connect to app.js (where we import dotenv) they are not
//in the same scope, meaning socketserver won't be able to access the environment variables
//dotenv => app.js => server.js while socketServer.js => server.js


const cloudfrontDomainName = process.env.CLOUDFRONT_DOMAIN_NAME
const isProduction = process.env.NODE_ENV === 'production'

const awsCredentials ={
  credentials:{
    accessKeyId: process.env.ACCESS_KEY,
    secretAccessKey: process.env.SECRET_ACCESS_KEY
  },
  region: process.env.AWS_REGION
}

export const logger = winston.createLogger({
  level: 'error',
  format: winston.format.json(),
  transports: [
    isProduction?
    new WinstonCloudWatch({
      awsOptions:awsCredentials,
      logGroupName: process.env.CLOUDWATCH_ERROR_LOG_GROUP_NAME,
      logStreamName: process.env.CLOUDWATCH_ERROR_LOG_STREAM,
      awsRegion: process.env.CLOUDWATCH_REGION 
    }
    ):
    new winston.transports.File({ filename: 'error.log'})
  ]
})

const infoLogger = winston.createLogger({
  level:'info',
  format: winston.format.json(),
  transports: [
    isProduction?
    new WinstonCloudWatch({
      awsOptions:awsCredentials,
      logGroupName: process.env.CLOUDWATCH_INFO_LOG_GROUP_NAME,
      logStreamName: process.env.CLOUDWATCH_INFO_LOG_STREAM,
      awsRegion: process.env.CLOUDWATCH_REGION 
    }
    ):
    new winston.transports.File({ filename: 'info.log'})
  ]
})

const redisConfig = isProduction?{
  username: process.env.REDIS_USERNAME,
  password: process.env.REDIS_PASSWORD,
  port: 25061,
  tls:{},
  connectTimeout: 10000,
  host: process.env.REDIS_HOST,
  retryStrategy: function(retries){
    if(retries > 10){
      logger.error("Too many Redis connection retries, stopping retries.");
      return null
    }
    return 5000*retries; // Delay for the next reconnect attempt in milliseconds
  }}:{
  // Default configuration for development (local Redis server)
  host: 'localhost',
  port: 6379
}
  



const redisClient = new Redis(redisConfig)

redisClient.on('connect', () => {
  infoLogger.info('Connected to Redis');
});

redisClient.on('error', (err) => {
  logger.error('Redis error', err);
})

redisClient.on('error', (err) => {
  logger.error('Redis Client Error', {message:err})
});

//Flush all data during server restart.
//Since we only use redis for updating user status, this works.
const clearRedisData = async () => {
  try{
    await redisClient.flushall()
    infoLogger.info('Redis data cleared on restart as configured')
  }catch(err){
    logger.error('Redis Flush All Error', {message:err.message})
  }
}

if (process.env.ALLOW_REDIS_FLUSH_ON_RESTART === 'true' && redisClient) {
  await clearRedisData();
}

const getUserIdFromSocket = async (token) => {
  try {
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET)
    return decoded.id
  } catch (error) {
    logger.error('Token Decoding Error', {message:error.message, stack:error.stack})
  }
};


const delay = ms => new Promise(resolve => setTimeout(resolve, ms))
// Manage connections
export default (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: function (origin, callback) {
        const allowedOrigins = [process.env.CLIENT_URL_PROD, process.env.CLIENT_URL_DEV];
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Origin not allowed by CORS'));
        }
      },
      methods: ['GET', 'POST'],
    },
  })

  io.on('connection', async (socket) => {
    const verifiedCurrentUserId = await getUserIdFromSocket(socket.handshake.query.token);
    //err
    try{
      const incrStatusCount = await redisClient.incr(`user:${verifiedCurrentUserId}:connections`)
      if(incrStatusCount === 1){
        const currentUserData = await User.findByIdAndUpdate(verifiedCurrentUserId, {status: 'Online'}, {new:true})
          .select('friends groups')
          .populate({path:'friends.friend', select:'status'})
          .populate({path:'friends.channel', select:'channelNumber'})
          .populate({path:'groups', select:'channelNumber'})
        const filteredFriends = [...currentUserData.friends].filter(friend=>friend.status==='Friend')
        const friendChannels = filteredFriends.map(friend=>friend.channel)
        friendChannels.forEach(channel=>{
          io.to(`channel-${channel._id}`).emit(`user_status_update_online`,
          {userId:currentUserData._id, channelId:channel._id, channelNumber:channel.channelNumber, type:'Friend'})
        })
        const groupChannels = [...currentUserData.groups]
        groupChannels.forEach(channel=>{
          io.to(`channel-${channel.id}`).emit(`user_status_update_online`,
          {userId:currentUserData._id, channelId:channel._id, channelNumber:channel.channelNumber})
        })
      }
    }catch(err){
      logger.error('User Status Icrement Error', {message:err.message, stack:err.stack})
    }

    //JOIN ROOM
    socket.on('personal_live_update', ()=>{
      socket.join(`user-${verifiedCurrentUserId}`)
    })

    socket.on('join_channel_room', (data) => {
      socket.join(data.channelNumber);
    });

    socket.on('join_channel_verify_message', (data)=>{
      socket.join(`channel-${data.channelNumber}-verify-message-${verifiedCurrentUserId}`)
    })

    socket.on('channel_live_updates', (channelIds)=>{
      channelIds.forEach(channelId=>{
        socket.join(`channel-${channelId}`)
      })
    })

    
    //Leave Room
    socket.on('leave_personal_live_update', ()=>{
      socket.leave(`user-${verifiedCurrentUserId}`)
    })

    socket.on('leave_channel_room', (channelNumber) => {
      socket.leave(channelNumber);
    });

    socket.on('leave_channel_live_updates', (channelIds)=>{
      channelIds.forEach(channelId=>{
        socket.leave(`channel-${channelId}`)
      })
    })

    socket.on('leave_channel_verify_message', (data)=>{
      socket.leave(`channel-${data.channelNumber}-verify-message-${verifiedCurrentUserId}`)
    })


    // Listen for messages
    socket.on('send_message', async (data) => {
      const session = await mongoose.startSession()
      session.startTransaction()
      try{
        await Chat.create([{
          sender: verifiedCurrentUserId,
          channel: data.channel,
          content: data.content,
          time: data.time,
          formattedDate: data.formattedDate
        }], {session:session});
        // Update the last message of the channel
        const updateChannel = await Channel.findByIdAndUpdate(
          { _id: data.channel }, 
          { lastMessage: data.time, formattedLastMessage: data.formattedDate, seen: [`${verifiedCurrentUserId}`]},
          {new:true, session:session}
        )
        //Although the newMessage document consists of sender as a mongoose object id,
        //we can use spread operator and add a similar key to overwrite it.
        const messageInfo = {
          time: data.time,
          content: data.content,
          channel:data.channel,
          sender: data.sender,
          formattedDate: data.formattedDate
        };
        await session.commitTransaction()
        io.to(`channel-${data.channelNumber}-verify-message-${verifiedCurrentUserId}`).emit('message_verified',
        {sentContent:data.content[0]}
        )
        io.to(`channel-${data.channel}`).emit('channel_lastmsg_update', 
        {channelId:data.channel, channelNumber:data.channelNumber,  seen: updateChannel.seen,
        newTime:data.time, newFormattedTime:data.formattedDate, message:messageInfo, channelType:data.channelType})
        socket.to(`${data.channelNumber}`).emit('receive_message', messageInfo);
      }catch(err){
        logger.error('Send Message Error', {message:err.message, stack:err.stack})
        await session.abortTransaction()
      }finally{
        await session.endSession()
      }
    });

    //Invite a user to the group channel
    socket.on('user_invite_success', async(data)=>{
      const session = await mongoose.startSession()
      session.startTransaction()
      try{
        const userObject = await User.findById(data.inviteUser).select('displayName friendTag _id photo status').session(session).lean()
        userObject.photoUrl = `${cloudfrontDomainName}/${userObject.photo}`
        const currChannelObject = await Channel.findById(data.channelId)
          .select('photo channelNumber _id channelName channelType lastMessage id formattedLastMessage seen').session(session).lean()
        await session.commitTransaction()
        currChannelObject.photoUrl = `${cloudfrontDomainName}/${currChannelObject.photo}`
        io.to(`channel-${data.channelId}`).emit(`channel_member_update`, 
        {user:userObject, channelNumber:currChannelObject.channelNumber, newTime:data.newTime, type:'Joined'})
        socket.to(`user-${userObject._id}`).emit('invited_to_group', currChannelObject)
      }catch(err){
        logger.error('User Invite Success Live Update Error', {message:err.message, stack:err.stack})
        await session.abortTransaction()
      }finally{
        await session.endSession()
      }
    })

    //When a user left the group channel
    socket.on('leave_group', async(data)=>{
      try{
        const user = await User.findById(verifiedCurrentUserId).select('displayName friendTag_id photo status')
        user.photoUrl = `${cloudfrontDomainName}/${user.photo}`
        io.to(`channel-${data.channelId}`).emit(`channel_member_update`, {user, channelNumber:data.channelNumber, type:'Left'})
      }catch(err){
        logger.error('Leave Group Live Update Error', {message:err.message, stack:err.stack})
      }
    })
    
    socket.on("continue_message", async(data)=>{
      let retries = 3; // Maximum number of retries
      let delayTime = 1000; // Delay time in milliseconds
      const attemptOperation = async ()=>{
        try{
          const updatedMessage = await Chat.findOneAndUpdate(
            {channel:data.channel, sender:verifiedCurrentUserId, time:data.prevTime},
            {time:data.newTime, $push:{content:data.content}},
               {new:true})
          //we don't need to update the formattedLastMessage too, since this is a continue_message
          const updateChannel = await Channel.findByIdAndUpdate({_id:data.channel}, {lastMessage:data.newTime, seen:[`${verifiedCurrentUserId}`]},
          {new:true})
          //Since we need the sender details, we cannot just pass the updatedMessage
          //directly to the receive_message, the only sender info we have on chat model is the id      
          const messageInfo = {
            time: updatedMessage.time,
            sender: data.sender,
            content: updatedMessage.content,
            channel: updatedMessage.channel,
            formattedDate: updatedMessage.formattedDate,
            updated: true,
          }
          io.to(`channel-${data.channelNumber}-verify-message-${verifiedCurrentUserId}`).emit('message_verified',
          {sentContent:data.content}
          )
          socket.to(data.channelNumber).emit('receive_message', messageInfo)
          io.to(`channel-${updatedMessage.channel}`).emit(`channel_lastmsg_update`,         
          {channelId:updatedMessage.channel, channelNumber:data.channelNumber, 
            seen: updateChannel.seen,
            channelType:data.channelType,
            newTime:updatedMessage.time, message:messageInfo, })
        }catch(err){
          if(retries > 0){
            retries--;
            await delay(delayTime); // Wait for a specified delayTime before retrying
            return attemptOperation(); // Retry the operation
          }
          logger.error('Continue Message Error', {message:err.message, stack:err.stack})
      }}
      await attemptOperation()
    })

    //When a user havent seen the latest message and opened the channel
    socket.on('new_message_seen', async (data)=>{
      try{
        await Channel.findByIdAndUpdate({_id:data.channelId}, {
          $push: {
              seen: verifiedCurrentUserId
          }}, {new:true})
      }catch(err){
        logger.error('New Message Seen Error', {message:err.message, stack:err.stack})
      }
    })

    //When a user sends a friend-request live update
    socket.on("friend_request_sent", (data)=>{
      socket.to(`user-${data.requestedUserId}`).emit('receive-friend-request', data.requestDetails)
    })
    
    //When a user accepted a friend-request live update
    socket.on("accepted_pending_friend_request", (data)=>{
      socket.to(`user-${data.pendingUserId}`).emit(`friend_request_accepted`,
       {newFriendId:data.newFriendId, newChannelInfo:data.newChannelInfo})
    })

    //When a user declined a friend-request live update
      socket.on("declined_pending_friend_request", (data)=>{
        socket.to(`user-${data.declinedUser}`).emit("friend_request_declined", {userId:data.userId})
      })

    //When a new group channel has been created
    socket.on("new_group_channel_created", (data)=>{
      data.newMembers.forEach(member=>{
        socket.to(`user-${member}`).emit('new_group_channel', data.newChannel)
      })
    })

    //When a group channel has been deleted
    socket.on("group_channel_deleted", (data)=>{
      data.membersId.forEach(memberId=>{
        socket.to(`user-${memberId}`).emit('delete_group_channel',
        {channelId:data.channelId, channelNumber:data.channelNumber})
      })
    })

    //When a user unfriended someone
    socket.on("remove_friend", (data)=>{
      socket.to(`user-${data.friendId}`).emit('delete_friend_channel',
       {channelId:data.channelId, channelNumber:data.channelNumber})
    })

    //When a group channel leader changed the leader of the group channel.
    socket.on("group_channel_leader_change", (data)=>{
      socket.to(`user-${data.memberId}`).emit("new_group_leader", {channelNumber:data.channelNumber, newLeaderId:data.memberId})
    })

    socket.on("user-profile-settings-change", (data)=>{
      data.channelNumberAndIds.forEach(channelNumberAndId=>{
        io.to(`channel-${channelNumberAndId.channelId}`).emit('channel-member-update', 
        {updatedUser:data.updatedUser,
        channelNumber:channelNumberAndId.channelNumber})
      })
    })

    socket.on('disconnect', async () => {
      try{
        const decrStatusCount = await redisClient.decr(`user:${verifiedCurrentUserId}:connections`)
        if(decrStatusCount<=0){
          await redisClient.del(`user:${verifiedCurrentUserId}:connections`)
          const currentUserData = await User.findByIdAndUpdate(verifiedCurrentUserId, {status: 'Offline'}, {new:true})
          .populate({path:'friends.friend', select:'status'})
          .populate({path:'friends.channel', select:'channelNumber'})
          .populate({path:'groups', select:'channelNumber'})
          const filteredFriends = [...currentUserData.friends].filter(friend=>friend.status==='Friend')
          const friendChannels = filteredFriends.map(friend=>friend.channel)
          friendChannels.forEach(channel=>{
            socket.to(`channel-${channel.id}`).emit(`user_status_update_offline`,
            {userId:currentUserData._id, channelId:channel._id, channelNumber:channel.channelNumber, type:'Friend'})
          })
          const groupChannels = [...currentUserData.groups]
          groupChannels.forEach(channel=>{
            socket.to(`channel-${channel.id}`).emit(`user_status_update_offline`,
            {userId:currentUserData._id, channelId:channel._id, channelNumber:channel.channelNumber})
          })
        }
      }catch(err){
        logger.error('User Status Decrement Error', {message:err.message, stack:err.stack})
      }
    })
  })
};
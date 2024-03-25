import jwt from 'jsonwebtoken';
import Redis from 'redis';
import { Server } from 'socket.io';
import { promisify } from 'util';
import User from './models/userModel.js';
import Chat from './models/chatModel.js';
import Channel from './models/channelModel.js';
import dotenv from'dotenv'
dotenv.config({ path: './config.env' });

const cloudfrontDomainName = process.env.CLOUDFRONT_DOMAIN_NAME
const redisClient = Redis.createClient();
redisClient.on('error', (err) => console.log('Redis Client Error', err));
redisClient.connect();

//Flush all data during server restart.
//Since we only use redis for updating user status, this works.
const clearRedisData = async () => {
  await redisClient.flushAll();
};
clearRedisData();

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

    //JOIN ROOM
    socket.on('personal_live_update', ()=>{
      socket.join(`user-${verifiedCurrentUserId}`)
    })

    socket.on('join_channel_room', (data) => {
      console.log(`${data.displayName} JOINED ${data.channelNumber}`)
      socket.join(data.channelNumber);
    });

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
      const updateChannel = await Channel.findByIdAndUpdate(
        { _id: data.channel },
        { lastMessage: data.time, formattedLastMessage: data.formattedDate }
      )
      updateChannel.seen = [`${verifiedCurrentUserId}`]
      updateChannel.save()
      // Although the newMessage document consists of sender as a mongoose object id,
      // we can use spread operator and add a similar key to overwrite it.
      const messageInfo = {
        time: data.time,
        content: data.content,
        channel:data.channel,
        sender: data.sender,
        formattedDate: data.formattedDate
      };

      io.to(`channel-${data.channel}`).emit('channel_lastmsg_update', 
      {channelId:data.channel, channelNumber:data.channelNumber,  seen: updateChannel.seen,
      newTime:data.time, newFormattedTime:data.formattedDate, message:messageInfo, channelType:data.channelType})
      socket.to(`${data.channelNumber}`).emit('receive_message', messageInfo);
    });

    //Invite a user to the group channel
    socket.on('user_invite_success', async(data)=>{
      //add status on select, if status is already implemented ------------------------------
      const user = await User.findById(data.inviteUser).select('displayName friendTag _id photo status')
      const userObject = user.toObject()
      userObject.photoUrl = `${cloudfrontDomainName}/${userObject.photo}`
      const currChannel = await Channel.findById(data.channelId)
        .select('photo channelNumber _id channelName channelType lastMessage id formattedLastMessage seen')
      const currChannelObject = currChannel.toObject()
      currChannelObject.photoUrl = `${cloudfrontDomainName}/${currChannelObject.photo}`
      io.to(`channel-${data.channelId}`).emit(`channel_member_update`, 
      {user:userObject, channelNumber:currChannel.channelNumber, newTime:data.newTime, type:'Joined'})
      socket.to(`user-${userObject._id}`).emit('invited_to_group', currChannelObject)
    })

    //When a user left the group channel
    socket.on('leave_group', async(data)=>{
      const user = await User.findById(verifiedCurrentUserId).select('displayName friendTag_id photo status')
      user.photoUrl = `${cloudfrontDomainName}/${user.photo}`
      io.to(`channel-${data.channelId}`).emit(`channel_member_update`, {user, channelNumber:data.channelNumber, type:'Left'})
    })
    
    socket.on("continue_message", async(data)=>{
      const updatedMessage = await Chat.findOneAndUpdate(
        {channel:data.channel, sender:verifiedCurrentUserId, time:data.prevTime},
        {time:data.newTime, $push:{content:data.content}},
           {new:true})
      //we don't need to update the formattedLastMessage too, since this is a continue_message
      const updateChannel = await Channel.findByIdAndUpdate({_id:data.channel}, {lastMessage:data.newTime})
      updateChannel.seen = [`${verifiedCurrentUserId}`]
      updateChannel.save()
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
      io.to(`channel-${updatedMessage.channel}`).emit(`channel_lastmsg_update`,         
      {channelId:updatedMessage.channel, channelNumber:data.channelNumber, 
        seen: updateChannel.seen,
        channelType:data.channelType,
        newTime:updatedMessage.time, message:messageInfo, })
    })

    //When a user havent seen the latest message and opened the channel
    socket.on('new_message_seen', async (data)=>{
      const u = await Channel.findByIdAndUpdate({_id:data.channelId}, {
        $push: {
            seen: verifiedCurrentUserId
        }}, {new:true})
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

    socket.on('disconnect', async () => {
      const decrStatusCount = await redisClient.decr(`user:${verifiedCurrentUserId}:connections`)
      if(decrStatusCount<=0){
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
    })
  })
};
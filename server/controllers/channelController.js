const catchAsync = require('../utils/catchAsync')
const AppError = require('../utils/appError')
const Channel = require('../models/channelModel')
const Chat = require('../models/chatModel')

exports.getUserChannel = catchAsync(async(req, res, next)=>{
    let currentChannel = await Channel.findOne({channelNumber:req.params.channelNumber})
        .populate({path:'members', select:'image displayName'})
    if (!currentChannel) {
        return next(new AppError("Channel not found.", 404));
    }
    //Since we populated the members it became an array of objects, so we need some to check each objects
    if (!currentChannel.members.some(member => member._id.toString() === req.user._id.toString())) {
        return next(new AppError("You are are not permitted to commit this action.", 401));
    }
    const findChat = await Chat.findOne({channel:currentChannel._id})
    //Since if there is no messages in the channel yet, and we populate the messages, it would cause an error.
    if(findChat){
        currentChannel = await Channel.findOne({channelNumber:req.params.channelNumber})
            .populate({path:'members', select:'image displayName'})
            .populate({path:'messages', populate:{path:'sender', select:'displayName image'}})
    }
    res.status(200).json({
        status:'success',
        channel: currentChannel
    })
})
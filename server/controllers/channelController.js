import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/appError.js';
import Channel from '../models/channelModel.js';
import Chat from '../models/chatModel.js';

export const getUserChannel = catchAsync(async(req, res, next)=>{
    let currentChannel = await Channel.findOne({channelNumber:req.params.channelNumber})
        .populate({path:'members', select:'photo displayName'})
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
        currentChannel = await Channel.findOne({channelNumber:req.params.channelNumber}).select('-__v')
            .populate({path:'members', select:'photo displayName'})
            .populate({path:'messages', select:'-__v', populate:{path:'sender', select:'displayName photo friendTag'}})
    }
    res.status(200).json({
        status:'success',
        channel: currentChannel
    })
})
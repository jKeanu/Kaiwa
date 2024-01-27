import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/appError.js';
import Channel from '../models/channelModel.js';
import Chat from '../models/chatModel.js';

export const getUserChannel = catchAsync(async(req, res, next)=>{
    let currentChannel = await Channel.findOne({channelNumber:req.params.channelNumber})
        .populate({path:'members', select:'photo displayName friendTag status'})
    if (!currentChannel) {
        return next(new AppError("Channel not found.", 404));
    }
    //Since we populated the members it became an array of objects, so we need some to check each objects
    if (!currentChannel.members.some(member => member._id.toString() === req.user._id.toString())) {
        return next(new AppError("You are are not permitted to commit this action.", 401));
    }
    res.status(200).json({
        status:'success',
        channel: currentChannel
    })
})

export const getChannelMessages = catchAsync(async(req, res, next)=>{
    const limit = parseInt(req.query.limit) || 15
    const skip = parseInt(req.query.skip) || 0
    const currentChannel = await Channel.findOne({channelNumber:req.params.channelNumber})
    const channelMessages = await Chat.find({channel:currentChannel._id})
                            .skip(skip)
                            .limit(limit)
                            .sort({time:-1})
                            .populate({path:'sender', select:'displayName photo friendTag'})
    res.status(200).json({
        status:"success",
        messages:channelMessages
    })
})
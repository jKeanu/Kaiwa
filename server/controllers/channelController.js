const catchAsync = require('../utils/catchAsync')
const AppError = require('../utils/appError')
const Channel = require('../models/channelModel')

exports.getUserChannel = catchAsync(async(req, res, next)=>{
    const currentChannel = await Channel.findOne({channelNumber:req.params.channelNumber})
        .populate({path:'members', select:'image displayName'})
        .populate({path:'messages', populate:{path:'sender', select:'displayName image'}})

    if (!currentChannel) {
        return next(new AppError("Channel not found.", 404));
    }
    //Since we populated the members it became an array of objects, so we need some to check each objects
    if (!currentChannel.members.some(member => member._id.toString() === req.user._id.toString())) {
        return next(new AppError("You are not a member of this group.", 401));
    }
    res.status(200).json({
        status:'success',
        channel: currentChannel
    })
})
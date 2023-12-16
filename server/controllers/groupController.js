const mongoose = require('mongoose')
const User = require('../models/userModel')
const catchAsync = require('../utils/catchAsync')
const AppError = require('../utils/appError')
const Channel = require('../models/channelModel')

exports.createGroupChannel = catchAsync(async(req, res, next)=>{
    const session = await mongoose.startSession();
    session.startTransaction();
    try{
        if(!req.body.members.includes(req.params.userId)){
            await session.abortTransaction();
            return next(new AppError("The creator of the group should be included in the group.", 400))
        }
        //since create query accepts an array OR as a spread, we need to use the array
        //if we don't, it would see the {session} as another entry.
        const newChannel = await Channel.create([{
            channelType: 'Group',
            groupLeader: req.user._id,
            channelName: req.body.channelName,
            members: req.body.members,
        }], {session})
        //push the newly created channel id to the members groups field.
        const updateStatus = await User.updateMany({_id:{
            $in: req.body.members
        }},
        {$push:{
            groups:{
                channel: newChannel[0]._id
            }
        }}, {session})
        //check if all users listed has been updated
        if (updateStatus.modifiedCount !== req.body.members.length){
            await session.abortTransaction();
            return next(new AppError("One or more of the user selected to be a member of the group was invalid and/or do not exists.", 400))
        }
        await session.commitTransaction();
        res.status(200).json({
            status:"success"
        })
    }catch(err){
        await session.abortTransaction();
        //we handle this type of error in global error handler middleware
        if(err.name === 'ValidationError'){
            next(err)
        }else{
            next(new AppError("Failed to create a new Channel, please try again", 500))
        }
    }finally{
        await session.endSession()
    }
}
)


exports.getUserGroups = catchAsync(async(req, res, next)=>{
    const user = await User.findById(req.user._id).populate('groups.channel')
        .select("channelNumber image channelName channelType")
    if(!user){
        return next(new AppError("User does not exists", 404))
    }
    res.status(200).json({
        status:"success",
        data:user.groups
    })
})

exports.deleteGroup = catchAsync(async(req, res, next)=>{
    const groupChannel =  await Channel.findOne(req.params.channelId)
    if(req.params.userId!==groupChannel.groupLeader){
        return next(new AppError("You are not authorized to perform this action.", 401))
    }
})


const mongoose = require('mongoose')
const catchAsync = require('../utils/catchAsync')
const AppError = require('../utils/appError')
const Channel = require('../models/channelModel')
const Chat = require('../models/chatModel')


exports.sendMessage = catchAsync(async(req, res, next)=>{
    const session = await mongoose.startSession();
    session.startTransaction();
    try{
        const groupChannel = await Channel.findOne({_id:req.params.groupId, channelType:"Group"}).session(session)
        if(!groupChannel){
            await session.abortTransaction()
            return next(new AppError("Group channel with that ID does not exists.", 404))
        }
        if(!groupChannel.members.includes(req.user._id)){
            await session.abortTransaction()
            return next(new AppError("You are not permitted to send message to this group.", 400))
        }
        const newMessage = await Chat.create({
            sender:req.user._id,
            channel:groupChannel._id,
            content:req.body.content
        }, {session})
        await session.commitTransaction()
        res.status(201).json({
            status:'success',
            data:{
                message:newMessage
            }
        })
    }catch(err){
        console.log('ERROR!!!', err)
        next(err)
    }finally{
        await session.endSession()
    }
})
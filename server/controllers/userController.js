const mongoose = require('mongoose')
const User = require('../models/userModel')
const catchAsync = require('../utils/catchAsync')
const AppError = require('../utils/appError')


const checkStatus = (userId, userCheck, status) => 
    userCheck.friends.find(friend=>
        friend.friend.equals(userId)&&
        friend.status === status)

exports.addFriend = catchAsync(async (req, res, next)=>{
    const {friendTag, displayname} = req.body
    if(!friendTag || !displayname){
        return next(new AppError("Please provide both friend tag and the name of the user.", 400))
    }
    const addUser = await User.findOne({friendTag, displayname})
    if(!addUser){
        return next(new AppError(`The user ${displayname} does not exist.`, 404))
    }
    if(checkStatus(req.user._id, addUser, 'Pending')){
        console.log(checkStatus(req.user._id, addUser, 'Pending'), '0-asd-0as-0d-')
        return next(new AppError(`You have already sent a friend request to ${displayname}.`, 409))
    }
    if(checkStatus(req.user._id, addUser, 'Sent')){
        return next(new AppError(`${displayname} have sent you a friend request, check the notifaction for more info.`, 409))
    }
    if(checkStatus(req.user._id, addUser, 'Accepted')){
        return next(new AppError(`You are already friends with ${displayname}.`, 409))
    }
    addUser.friends.push({friend:req.user._id, status:"Pending"})
    await User.findByIdAndUpdate(req.user._id, {$push:{
        friends:{
            friend: addUser._id,
            status:'Sent'
        }
    }},
    {
        new:true,
        runValidators: false
    })
    await addUser.save({validateBeforeSave:false})
    res.status(200).json({
        status:'success'
    })
})

exports.acceptFriend = catchAsync(async (req, res, next)=>{
    const {friendTag, displayname} = req.body
    const acceptUser = await User.findOne({friendTag, displayname})
    if(!acceptUser){
        return next(new AppError("User does not exists.", 404))
    }
    const pendingUser = checkStatus(req.user._id, acceptUser, "Sent")
    if(!pendingUser){
        return next(new AppError(`${displayname} did not send you a friend request.`))
    }
    pendingUser.status = "Accepted"
    await User.updateOne({_id:req.user._id, 
        'friends.friend': acceptUser._id},
        {$set: {'friends.$.status':"Accepted"}},
        {validateBeforeSave: false})
    acceptUser.save({validateBeforeSave:false})
    res.status(200).json({
        status:"success"
    })
})


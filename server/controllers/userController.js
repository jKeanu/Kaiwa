const mongoose = require('mongoose')
const User = require('../models/userModel')
const catchAsync = require('../utils/catchAsync')
const AppError = require('../utils/appError')



const checkStatus = (currentUserId, userCheck, status) => 
    userCheck.friends.find(friend=>
        friend.friend.equals(currentUserId)&&
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
        return next(new AppError(`You have already sent a friend request to ${displayname}.`, 409))
    }
    if(checkStatus(req.user._id, addUser, 'Sent')){
        return next(new AppError(`${displayname} have sent you a friend request, check the notifaction for more info.`, 409))
    }
    if(checkStatus(req.user._id, addUser, 'Friend')){
        return next(new AppError(`You are already friends with ${displayname}.`, 409))
    }
    //Add a friend request (pending) status to the user
    addUser.friends.push({friend:req.user._id, status:"Pending"})
    await User.findByIdAndUpdate(req.user._id, {$push:{
        friends:{
            friend: addUser._id,
            status:'Sent'
        }
    }},
    {
        new:true,
    })
    //Ignore the passwordConfirm validation, otherwise, it would
    //trigger an error since we remove passwordConfirm every
    //new user has been created or we change password.
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
    pendingUser.status = "Friend"
    await User.updateOne({_id:req.user._id, 
        'friends.friend': acceptUser._id},
        {$set: {'friends.$.status':"Friend"}})
    acceptUser.save({validateBeforeSave:false})
    res.status(200).json({
        status:"success"
    })
})

exports.declineFriend = catchAsync(async(req, res, next)=>{
    const {friendTag, displayname} = req.body
    const declineUser = await User.findOne({friendTag, displayname})
    if(!declineUser){
        return next(new AppError(`${displayname} does not exists.`, 404))
    }
    const pendingUser = checkStatus(req.user._id, declineUser, "Sent")
    if(!pendingUser){
        return next(new AppError(`${displayname} did not send you a friend request.`))
    }
    await User.updateOne(
        {_id:declineUser._id},
        {$pull: {friends:{friend:req.user._id}}}
        )
    await User.updateOne(
        {_id:req.user._id},
        {$pull: {friends:{friend:declineUser._id}}}
        )
    res.status(200).json({
        status:"success"
    })
})
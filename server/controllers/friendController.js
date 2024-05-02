import mongoose from 'mongoose';
import User from '../models/userModel.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/appError.js';
import Channel from '../models/channelModel.js';
import Chat from '../models/chatModel.js'
import { MongoServerError } from 'mongodb'
import dotenv from 'dotenv'
dotenv.config({ path: '../config.env' });


const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

//Checking the friendship status with the other user.
const findFriendshipStatus = (currentUserId, userCheck, status) => 
    userCheck.friends.find(friend=>
        friend.friend.equals(currentUserId) &&
        friend.status === status)

export const getFriend = catchAsync(async(req, res, next)=>{
    const friendUser = await User.findById(req.params.friendId)
    if(!friendUser){
        return next(new AppError("User does not exists.", 404))
    }
    //Determine if the current user is friend with the other user
    if(!findFriendshipStatus(req.user._id, friendUser, 'Friend')){
        return next(new AppError(`You are not friends with the user to perform this action.`, 409))
    }
    res.status(200).json({
        status:"success",
        data:{
            friend:friendUser
        }
    })
})

export const addFriend = catchAsync(async (req, res, next)=>{
    const session = await mongoose.startSession();
    session.startTransaction();
    const {friendTag, displayName} = req.body
    try{
        if(!friendTag || !displayName){
            await session.abortTransaction(); // Abort the transaction
            return next(new AppError("Please provide both friend tag and the name of the user.", 400))
        }
        if(friendTag === req.user.friendTag && displayName === req.user.displayName){
            await session.abortTransaction();
            return next(new AppError("You cannot make a friend request to yourself.", 400))
        }
        //Find the user with the corresponding friendTag and displayName
        const addUser = await User.findOne({friendTag, displayName}).session(session)
        if(!addUser){
            await session.abortTransaction();
            return next(new AppError(`The user does not exist.`, 404))
        }
        //Check the status of the user that you want to add,
        //i.e, if already added, the status is Pending
        if(findFriendshipStatus(req.user._id, addUser, 'Pending')){
            await session.abortTransaction();
            return next(new AppError(`You have already sent a friend request to ${displayName}.`, 409))
        }
        //If the other user added you, the status is Sent
        if(findFriendshipStatus(req.user._id, addUser, 'Sent')){
            await session.abortTransaction();
            return next(new AppError(`${displayName} have already sent you a friend request.`, 409))
        }
        //If already friends with the user, the status is Friend
        if(findFriendshipStatus(req.user._id, addUser, 'Friend')){
            await session.abortTransaction();
            return next(new AppError(`You are already friends with ${displayName}.`, 409))
        }
        //Add a friend request (pending) status to the user
        addUser.friends.push({friend:req.user._id, status:"Pending"})
        const currUserData = await User.findByIdAndUpdate(req.user._id, {$push:{
            friends:{
                friend: addUser._id,
                status:'Sent'
            }
        }},
        {
            new:true,
            session
        })
        //Ignore the passwordConfirm validation, otherwise, it would
        //trigger an error since we remove passwordConfirm every
        //new user has been created or we change password.
        await addUser.save({session, validateBeforeSave:false})
        //pending request details
        const newPendingRequestDetails = addUser.friends.find(friend=>friend.friend===req.user._id)
        await User.populate(newPendingRequestDetails, {path:'friend', select:'displayName FriendTag status photo', options:{session}})
        //Sent request details
        const newSentRequestDetails = currUserData.friends.find(friend=>friend.friend.toString()===addUser._id.toString())
        await User.populate(newSentRequestDetails, {path:'friend', select:'displayName FriendTag status photo', options:{session}})
        await session.commitTransaction()
        const newPendingObject = newPendingRequestDetails.toObject()
        newPendingObject.friend.photoUrl = `${process.env.CLOUDFRONT_DOMAIN_NAME}/${newPendingRequestDetails.friend.photo}`
        const newSentObject = newSentRequestDetails.toObject()
        newSentObject.friend.photoUrl = `${process.env.CLOUDFRONT_DOMAIN_NAME}/${newSentRequestDetails.friend.photo}`
        res.status(201).json({
            status:'success',
            pendingRequestDetails:newPendingObject,
            sentRequestDetails:newSentObject
    })}catch(err){
        await session.abortTransaction();
        next(err) // Use 500 for server errors
    }finally{
        await session.endSession()
    }
})

export const acceptFriend = catchAsync(async (req, res, next)=>{
    let retries = 3; // Maximum number of retries
    let delayTime = 1000; // Delay time in milliseconds
    const attemptOperation = async ()=>{
        const session = await mongoose.startSession();
        session.startTransaction();
        try{
            const acceptUser = await User.findById(req.params.friendId).session(session)
            if(!acceptUser){
                await session.abortTransaction(); //Abort the transaction
                return next(new AppError("User does not exists.", 404))
            }
            //Check if the user is already friends with the other user.
            if(findFriendshipStatus(req.user._id, acceptUser, "Friend")){
                await session.abortTransaction();
                return next(new AppError(`You're already friends with ${acceptUser.displayName}.`, 409))       
            }
            //Check if the other user sent the friend request, if the isSent exists, it means the user sent
            //the request.
            const isSent = findFriendshipStatus(req.user._id, acceptUser, "Sent")
            if(!isSent){
                await session.abortTransaction();
                return next(new AppError(`The user did not send you a friend request.`, 400))
            }
            //Although isSent is used to identify whether the user sent a friend requests, 
            //it's value is the user document.
            isSent.status = "Friend"
            //Since both users are soon to be friend, we also need a channel on where they could communicate
            //
            //since create query accepts an array OR as a spread, we need to use the array 
            //if we don't, it would see the {session} as another entry.
            //In other words, distinguish between the documents to be created and the options object
            const friendChannel = await Channel.create([{
                members:[req.user._id, acceptUser._id],
                channelType: 'Friend'
            }],
            {session})
            isSent.channel = friendChannel[0]._id
            // refers to the position of the first element in the friends array that 
            //matches the condition specified in the query part ('friends.friend': acceptUser._id)
            await User.findOneAndUpdate({_id:req.user._id, 
                'friends.friend': acceptUser._id},
                {$set:
                    {'friends.$.status':"Friend", 
                    'friends.$.channel':friendChannel[0]._id
                }},
                {session, new:true})
            const newChannel = await Channel.findById(friendChannel[0]._id)
                .select('-__v')
                .populate({path:'members', select:'photo displayName friendTag status'})
                .session(session)
            const newChannelObject = newChannel.toObject()
            newChannelObject.photoUrl = `${process.env.CLOUDFRONT_DOMAIN_NAME}/${newChannel.photo}`
            for(const member of newChannelObject.members){
                member.photoUrl = `${process.env.CLOUDFRONT_DOMAIN_NAME}/${member.photo}`
            }
            //We just need the general
            await acceptUser.save({session, validateBeforeSave:true})
            await session.commitTransaction()
            res.status(200).json({
                status:"success",
                newChannel: newChannelObject})
            }catch(err){
                if(err instanceof MongoServerError && err.code === 112 && retries > 0){
                    retries--;
                    await delay(delayTime); // Wait for a specified delayTime before retrying
                    await session.abortTransaction(); // Important to abort the current transaction
                    return attemptOperation(); // Retry the operation
                }
                await session.abortTransaction();
                next(err)
            //the finally block has a higher priority and will always execute before the return operation is completed.
            }finally{
                await session.endSession()
            }
    }
    await attemptOperation()
})

export const unfriend = catchAsync(async(req, res, next)=>{
    const session = await mongoose.startSession();
    session.startTransaction();
    try{
        const removeUser = await User.findById(req.params.friendId).session(session)
        if(!removeUser){
            await session.abortTransaction();
            return next(new AppError(`User does not exists.`, 404))
        }
        const isFriend = findFriendshipStatus(req.user._id, removeUser, "Friend")
        if(!isFriend){
            await session.abortTransaction();
            return next(new AppError(`You are not friends with the user.`, 403))
        }
        const deleteChannel = await Channel.findOneAndDelete(
            //$all operator matches arrays that contain all the specified elements.
            {members:{ $all: [req.user._id, removeUser._id] }, channelType:'Friend'})
                .session(session)
        await Chat.deleteMany({channel:deleteChannel._id}).session(session)
        await User.updateOne(
            {_id:removeUser._id},
            {$pull: {friends:{friend:req.user._id}}},
            {session}
            )
        await User.updateOne(
            {_id:req.user._id},
            {$pull: {friends:{friend:removeUser._id}}},
            {session}
        )
        await session.commitTransaction();
        res.status(204).end()
    }catch(err){
        await session.abortTransaction();
        next(err)
    }finally{
        await session.endSession()
    }
})


export const declineFriend = catchAsync(async(req, res, next)=>{
    let retries = 3; // Maximum number of retries
    let delayTime = 1000; // Delay time in milliseconds
    const attemptOperation = async ()=>{
        const session = await mongoose.startSession();
        session.startTransaction();
        try{
            const removeUser = await User.findById(req.params.friendId).session(session)
            if(!removeUser){
                await session.abortTransaction();
                return next(new AppError(`User does not exists.`, 404))
            }
            const isRequested = findFriendshipStatus(req.user._id, removeUser, "Sent")
            if(!isRequested){
                await session.abortTransaction();
                return next(new AppError(`The user did not send you a friend request.`, 400))
            }
            await User.updateOne(
                {_id:removeUser._id},
                {$pull: {friends:{friend:req.user._id}}},
                {session}
                )
            await User.updateOne(
                {_id:req.user._id},
                {$pull: {friends:{friend:removeUser._id}}},
                {session}
            )
            await session.commitTransaction();
            res.status(204).end()
        }catch(err){
            if(err instanceof MongoServerError && err.code === 112 && retries > 0){
                retries--;
                await delay(delayTime); // Wait for a specified delayTime before retrying
                await session.abortTransaction(); // Important to abort the current transaction
                return attemptOperation(); // Retry the operation
            }
            await session.abortTransaction();
            next(err)
        }finally{
            await session.endSession()
        }
    }
    await attemptOperation()
})

export const getUserFriends = catchAsync(async(req, res, next)=>{
    const user = await User.findById(req.user._id)
        .populate({path:'friends.friend', select:'displayName photo friendTag'})
    if(!user){
        return next(new AppError("The user does not exists.", 404))
    }
    res.status(200).json({
        status:"success",
        data: user.friends
        })
})

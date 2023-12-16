const mongoose = require('mongoose')
const User = require('../models/userModel')
const catchAsync = require('../utils/catchAsync')
const AppError = require('../utils/appError')
const Channel = require('../models/channelModel')

exports.validateCurrentUser = (req, res, next) => {
    if(req.params.userId !== req.user._id.toString()){
        return next(new AppError("You are not authorized to perform this action", 401))   
    }
    next()
}

const findFriendshipStatus = (currentUserId, userCheck, status) => 
    userCheck.friends.find(friend=>
        friend.friend.toString() === currentUserId &&
        friend.status === status)

exports.addFriend = catchAsync(async (req, res, next)=>{
    const session = await mongoose.startSession();
    session.startTransaction();
    const {friendTag, displayname} = req.body
    try{
        if(!friendTag || !displayname){
            await session.abortTransaction(); // Abort the transaction
            return next(new AppError("Please provide both friend tag and the name of the user.", 400))
        }
        if(friendTag === req.user.friendTag && displayname === req.user.displayname){
            await session.abortTransaction();
            return next(new AppError("You cannot make a friend request to yourself.", 400))
        }
        //Find the user with the corresponding friendTag and displayname
        const addUser = await User.findOne({friendTag, displayname}).session(session)
        if(!addUser){
            await session.abortTransaction();
            return next(new AppError(`The user ${displayname} with the provided nameTag cannot be found.`, 404))
        }
        //Check the status of the user that you want to add,
        //i.e, if already added, the status is Pending
        if(findFriendshipStatus(req.params.userId, addUser, 'Pending')){
            await session.abortTransaction();
            return next(new AppError(`You have already sent a friend request to ${displayname}.`, 409))
        }
        //If the other user added you, the status is Sent
        if(findFriendshipStatus(req.params.userId, addUser, 'Sent')){
            await session.abortTransaction();
            return next(new AppError(`${displayname} have sent you a friend request, check the notifaction for more info.`, 409))
        }
        //If already friends with the user, the status is Friend
        if(findFriendshipStatus(req.params.userId, addUser, 'Friend')){
            await session.abortTransaction();
            return next(new AppError(`You are already friends with ${displayname}.`, 409))
        }
        //Add a friend request (pending) status to the user
        addUser.friends.push({friend:req.params.userId, status:"Pending"})
        await User.findByIdAndUpdate(req.params.userId, {$push:{
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
        await session.commitTransaction();  // Commit the transaction
        res.status(200).json({
            status:'success'
    })}catch(err){
        console.log('ERROR!!!!', err)
        await session.abortTransaction();
        next(new AppError("An error occurred while making a request to the user", 500)) // Use 500 for server errors
    }finally{
        await session.endSession()
    }
})

exports.acceptFriend = catchAsync(async (req, res, next)=>{
    const session = await mongoose.startSession();
    if(req.body.status !== 'Friend'){
        return next(new AppError("Invalid input", 400))
    }
    session.startTransaction();
    try{
        const acceptUser = await User.findById(req.params.friendId).session(session)
        if(!acceptUser){
            await session.abortTransaction(); //Abort the transaction
            return next(new AppError("User does not exists.", 404))
        }
        //Check if the user is already friends with the other user.
        if(findFriendshipStatus(req.params.userId, acceptUser, req.body.status)){
            await session.abortTransaction();
            return next(new AppError(`You're already friends with ${acceptUser.displayname}.`, 409))       
        }
        //Check if the other user sent the friend request, if the isSent exists, it means the user sent
        //the request.
        const isSent = findFriendshipStatus(req.params.userId, acceptUser, "Sent")
        if(!isSent){
            await session.abortTransaction();
            return next(new AppError(`${acceptUser.displayname} did not send you a friend request.`, 400))
        }
        //Although isSent is used to identify whether the user sent a friend requests, 
        //it's value is the user document.
        isSent.status = req.body.status
        //Since both users are soon to be friend, we also need a channel on where they could communicate
        const friendChannel = await Channel.create([{
            members:[req.user._id, acceptUser._id],
            channelType: 'Friend'
        }],
        {session})
        isSent.channel = friendChannel[0]._id
        console.log(friendChannel[0], '555555555555555555')
        await User.updateOne({_id:req.params.userId, 
            'friends.friend': acceptUser._id},
            {$set:
                {'friends.$.status':req.body.status, 
                'friends.$.channel':friendChannel[0]._id
            }},
            {session})
        await acceptUser.save({session, validateBeforeSave:false})
        await session.commitTransaction(); 
        res.status(200).json({
            status:"success"
        }
        )}catch(err){
            console.log('ERROR!!!!', err)
            await session.abortTransaction();
            next(new AppError("An error occurred while accepting the friend request", 500))
        }finally{
            await session.endSession()
        }
})

exports.removeFriend = catchAsync(async(req, res, next)=>{
    const session = await mongoose.startSession();
    const {action} = req.query
    if(!action){
        return next(new AppError("Missing Required Query Parameter. The 'action' query parameter is required but was not provided.", 400)) 
    }
    session.startTransaction();
    try{
        const removeUser = await User.findById(req.params.friendId).session(session)
        if(!removeUser){
            await session.abortTransaction();
            return next(new AppError(`User does not exists.`, 404))
        }
        if(action === 'unfriend'){
            const isFriend = findFriendshipStatus(req.params.userId, removeUser, "Friend")
            if(!isFriend){
                await session.abortTransaction();
                return next(new AppError(`The user is not in your friend list`, 409))
            }
        }else if(action === "decline"){
            const isRequested = findFriendshipStatus(req.params.userId, removeUser, "Sent")
            if(!isRequested){
                await session.abortTransaction();
                return next(new AppError(`The user did not send you a friend request.`, 400))
            }
        }
        await Channel.findOneAndDelete({members:[req.user._id, removeUser._id], channelType:'Friend'}).session(session)
        await User.updateOne(
            {_id:removeUser._id},
            {$pull: {friends:{friend:req.params.userId}}},
            {session}
            )
        await User.updateOne(
            {_id:req.params.userId},
            {$pull: {friends:{friend:removeUser._id}}},
            {session}
        )
        await session.commitTransaction();
        res.status(200).json({
            status:"success"
        })
    }catch(err){
        console.log('ERROR!!!!', err)
        await session.abortTransaction();
        next(new AppError("An error occurred while accepting the friend request", 500))
    }finally{
        await session.endSession()
    }
})


exports.getUserFriends = catchAsync(async(req, res, next)=>{
    const user = await User.findById(req.params.userId)
        .populate({path:'friends.friend', select:'name photo displayname friendTag channels'})
    if(!user){
        return next(new AppError("The user does not exists.", 404))
    }
    res.status(200).json({
        status:"success",
        data: user.friends
        })
})
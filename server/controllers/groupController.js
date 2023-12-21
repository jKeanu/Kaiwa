const mongoose = require('mongoose')
const User = require('../models/userModel')
const catchAsync = require('../utils/catchAsync')
const AppError = require('../utils/appError')
const Channel = require('../models/channelModel')

const filterObj = (obj, ...allowedfields)=>{
    const newObj = {}
    //Object.keys(obj) this would return an array that contains the keys of the objects
    Object.keys(obj).forEach(el=>{
       if (allowedfields.includes(el)) newObj[el] = obj[el]
    })
    return newObj
}

exports.getGroupChannel = catchAsync(async(req, res, next)=>{
    const groupChannel = await Channel.findOne({_id:req.params.groupId, channelType:'Group'})
    if(!groupChannel){
        return next(new AppError('No group Channel with that ID does not exists', 404))
    }
    if(!groupChannel.members.includes(req.user._id)){
        return next(new AppError("You are not a member of this group.", 401))   
    }
    res.status(200).json({
        status:'success',
        data:{
            group:groupChannel
        }
    })
})

exports.createGroupChannel = catchAsync(async(req, res, next)=>{
    const session = await mongoose.startSession();
    session.startTransaction();
    try{
        if(!req.body.members.includes(req.user._id.toString())){
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
            groups:newChannel[0]._id
        }}, {session})
        //check if all users listed has been updated
        if (updateStatus.modifiedCount !== req.body.members.length){
            await session.abortTransaction();
            return next(new AppError("Failed to create a group channel. One or more of the input is invalid", 400))
        }
        await session.commitTransaction();
        res.status(201).json({
            status:"success",
            data:newChannel
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
    }}
)

exports.updateGroupDetails = catchAsync( async(req, res, next)=>{
    const session = await mongoose.startSession();
    session.startTransaction();
    try{
        const filteredBBody = filterObj(req.body, 'channelName', 'image')
        const updatedGroup = await Channel.findByIdAndUpdate(req.params.groupId,
             filteredBBody, 
             {new:true, runValidators:true, session})
        if(!updatedGroup.members.includes(req.user._id)){
            await session.abortTransaction()
            return next(new AppError("You are not a member of this group.", 401))   
        }
        await session.commitTransaction()
        res.status(200).json({
            status:'success',
            data:{
                group:updatedGroup
            }
        })
    }catch(err){
        await session.abortTransaction()
        console.log('ERRROR!!!', err)
        next(err)
    }finally{
        await session.endSession()
    }
    //this filters out unwanted field names on the req.body
})


exports.deleteGroup = catchAsync(async (req, res, next)=>{
    const session = await mongoose.startSession();
    session.startTransaction();
    try{
        const groupChannel =  await Channel.findOne({_id:req.params.groupId, channelType:"Group"}).session(session)
        if(!groupChannel){
            await session.abortTransaction()
            return next(new AppError("Group channel with that ID does not exists", 404))
        }
        //Since everytime we create a group channel we always include the group leader
        //to the member; we don't need to check if the logged in user is a member.
        if(req.user._id.toString()!==groupChannel.groupLeader.toString()){
            await session.abortTransaction()
            return next(new AppError("You are not permitted to perform this action.", 401))
        }
        const updateStatus = await User.updateMany({
            _id:{$in:groupChannel.members}},
            {$pull:{
                groups:groupChannel._id
            }}, {session})
        // if (updateStatus.modifiedCount !== groupChannel.members.length){
        //     await session.abortTransaction();
        //     return next(new AppError("One or more of the input is invalid", 400))
        // }
        await Channel.findOneAndDelete({_id:req.params.groupId, channelType:"Group"}).session(session)
        await session.commitTransaction()
        res.status(200).json({
            status:"success"
        })
    }catch(err){
        await session.abortTransaction()
        console.log('ERROR!!!', err)
        next(err)
    }finally{
        await session.endSession()
    }
})

exports.getGroupMembers = catchAsync(async (req, res, next)=>{
    const groupChannel = await Channel.findOne({_id:req.params.groupId, channelType:"Group"})
        .populate({path:'members', select:'displayname friendTag image'})
    const currentUser = await User.findById(req.user._id)
    if(!groupChannel){
        return next(new AppError("Group channel with that ID does not exists", 404))
    }
    if(!currentUser.groups.includes(groupChannel._id)){
        return next(new AppError("You are not a member of this group.", 401))
    }
    res.status(200).json({
        status:"success",
        data:{
            members:groupChannel.members
        }
    })
})


exports.inviteMember = catchAsync(async (req, res, next)=>{
    const session = await mongoose.startSession();
    session.startTransaction();
    try{
        const groupChannel = await Channel.findOne({_id:req.params.groupId, channelType:"Group"})
        if(!groupChannel){
            return next(new AppError("Group channel with that ID does not exists", 404))
        }
        //Check if the user that is being invited exists.
        const user = await User.findById(req.body.userId).session(session)
        if (!user){
            await session.abortTransaction()
            return next(new AppError("User does not exists", 404))
        }
        //if the current user is not a member of the group
        if(!groupChannel.members.includes(req.user._id.toString())){
            await session.abortTransaction()
            return next(new AppError("You are not permitted to invite a user to this group", 401))    
        }
        //Check if the logged in user is friends with the user that we're inviting in the group
        const findStatus = user.friends.find(friend=>
            friend.friend.toString() ===req.user._id.toString() &&
            friend.status === 'Friend')
        //If the findStatus does not exists it means that the logged in user is not friends with
        //the person he/she is inviting.
        if(!findStatus){
            await session.abortTransaction()
            return next(new AppError("Friends with the user is required to invite.", 400))
        }
        //Checking if the user that is being invited is already in the group
        if(groupChannel.members.includes(user._id)){
            await session.abortTransaction()
            return next(new AppError("The user is already in the group.", 400))
        }
        //pushing the channel into the invited users groups 
        user.groups.push(groupChannel._id)
        //updating the group member
        groupChannel.members.push(user._id)
        await groupChannel.save({session})
        await user.save({session, validateBeforeSave:false})
        await session.commitTransaction();
        res.status(200).json({
            status:"success",
        })
    }catch(err){
        console.log('ERROR!!!', err)
        await session.abortTransaction()
        next(err)
    }finally{
        await session.endSession()
}
})

exports.leaveGroup = catchAsync(async (req, res, next)=>{
    const session = await mongoose.startSession();
    session.startTransaction();
    try{
        const user = await User.findById(req.user._id).session(session)
        const groupChannel = await Channel.findOne({_id:req.params.groupId, channelType:"Group"}).session(session)
        if(!groupChannel){
            await session.abortTransaction()
            return next(new AppError("Group channel with that ID does not exists", 404))
        }
        if(user._id.toString()===groupChannel.groupLeader.toString()){
            await session.abortTransaction()
            return next(new AppError("Assign a new group leader before you leave the group.", 400))
        }
        if(!groupChannel.members.includes(user._id)){
            await session.abortTransaction()
            return next(new AppError("You are not a member of this group.", 400))
        }
        //remove the group channel from the user's groups
        user.groups.pull(groupChannel._id)
        //remove the user from the group's members
        groupChannel.members.pull(user._id)
        await user.save({session, validateBeforeSave:false})
        await groupChannel.save({session})
        await session.commitTransaction();
        res.status(200).json({
            status:"success",
            data:{
                groups:user.groups
            }
        })
    }catch(err){
        await session.abortTransaction()
        console.log("ERROR!!!", err)
        next(err)
    }finally{
        await session.endSession()
    }
})


exports.changeGroupLeader =  catchAsync(async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try{
        const groupChannel = await Channel.findOne({_id:req.params.groupId, channelType:"Group"}).session(session)
        if (!groupChannel){
            await session.abortTransaction()
            return next(new AppError("The group channel with that ID does not exists", 404))
        }
        if (!groupChannel.groupLeader.equals(req.user._id)){
            await session.abortTransaction()
            return next(new AppError("You are not permitted to perform this action.", 401))
        }
        const findMember = groupChannel.members.find(member=>member.toString()===req.body.userId)
        if(!findMember){
            await session.abortTransaction()
            return next(new AppError("Inputted user is not a member of this group.", 400))
        }
        groupChannel.groupLeader = findMember
        await groupChannel.save({session})
        await session.commitTransaction()
        res.status(200).json({
            status:"success"
        })
    }catch(err){
        await session.abortTransaction()
        console.log("ERROR!!!", err)
        next(err)
    }finally{
        await session.endSession()
    }
})
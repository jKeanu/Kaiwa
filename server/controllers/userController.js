const User = require('../models/userModel')
const catchAsync = require('../utils/catchAsync')
const AppError = require('../utils/appError')


exports.addFriend = catchAsync(async (req, res, next)=>{
    const {friendTag, displayname} = req.body
    if(!friendTag || !displayname){
        return next(new AppError("Please provide both friend tag and the name of the user.", 400))
    }
    const addUser = await User.findOne({friendTag, displayname})
    if(!addUser){
        return next(new AppError("The user does not exist.", 404))
    }
    if(addUser.friends.find(friend => 
        friend.friend.equals(req.user._id) 
    && friend.status === 'Pending')){
        return next(new AppError("You have already sent a friend request to this user.", 409))
    }
    if(addUser.friends.find(friend =>
        friend.friend.equals(req.user._id) 
        && friend.status === 'Sent')){
        return next(new AppError("The user have sent you a friend request, check the notifaction for more info.", 409))
    }
    addUser.friends.push({friend:req.user._id, status:"Pending"})
    await addUser.save({validateBeforeSave:false})
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
    res.status(200).json({
        status:'success'
    })
})

exports.acceptFriend = catchAsync((req, res, next)=>{

})
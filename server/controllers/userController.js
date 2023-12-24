const mongoose = require('mongoose')
const User = require('../models/userModel')
const catchAsync = require('../utils/catchAsync')
const AppError = require('../utils/appError')

const filterObj = (obj, ...allowedfields)=>{
    const newObj = {}
    //Object.keys(obj) this would return an array that contains the keys of the objects
    Object.keys(obj).forEach(el=>{
       if (allowedfields.includes(el)) newObj[el] = obj[el]
    })
    return newObj
}

exports.updateUser = catchAsync(async(req, res, next)=>{
    if (req.body.password || req.body.passwordConfirm){
        return next(new AppError('This route is not for password updates.', 400))
    }
    const filteredBody = filterObj(req.body, 'displayName', 'friendTag', 'image')
    //We can run validators since the passwordConfirm validator only works on create or save.
    const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {new:true, runValidators:true})
    res.status(200).json({
        status:'success',
        data:{
            user: updatedUser
        }
    })
    
})
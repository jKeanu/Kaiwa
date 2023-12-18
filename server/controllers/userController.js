const mongoose = require('mongoose')
const User = require('../models/userModel')
const catchAsync = require('../utils/catchAsync')
const AppError = require('../utils/appError')
const Channel = require('../models/channelModel')


exports.updateUser = catchAsync(async(req, res, next)=>{
    
})
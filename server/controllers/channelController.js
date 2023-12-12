const catchAsync = require('../utils/catchAsync')
const AppError = require('../utils/appError')
const Channel = require('../models/channelModel')


exports.createChannel = catchAsync(async(req, res, next)=>{
    const newChannel = await Channel.create(req.body)
    res.status(200).json({
        status:"success",
        data:newChannel
    })
})
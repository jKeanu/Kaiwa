const User = require('../models/userModel')
const Channel = require('../models/channelModel')
const catchAsync = require('../utils/catchAsync')
const AppError = require('../utils/appError')
const multer = require('multer')
const sharp = require('sharp');
const {S3Client} = require('@aws-sdk/client-s3')

const s3 = new S3Client({
    credentials:{
        accessKeyId: process.env.ACCESS_KEY,
        secretAccessKey: process.env.SECRET_ACCESS_KEY
    },
    region: process.env.BUCKET_REGION
})


const multerStorage = multer.memoryStorage()

const multerFilter = (req, file, cb) => {
    if(file.mimetype.startsWith('image')){
        cb(null, true)
    }else{
        cb(new AppError('Please upload an image only file.', 400), false)
    }
}

const upload = multer({
    fileFilter: multerFilter,
    storage: multerStorage
})

exports.uploadProfileImage = upload.single('profileImage')       


exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
    if (!req.file) return next();
  
    req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;
    //.buffer is the raw binary data of the uploaded image file,
    await sharp(req.file.buffer)
      .resize(500, 500)
      .toFormat('jpeg')
      .jpeg({ quality: 90 })
      .toFile(`public/img/users/${req.file.filename}`);
  
    next();
});

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

exports.getMe = catchAsync(async(req, res, next)=>{
    //Since we only need to populate the group and friend channel when getting
    //the current logged information, we can just populate all of them here.
    const currentUser = await User.findById(req.user._id)
    .populate({path:'friends.friend', select:'displayName friendTag image'})
    .populate({path:'friends.channel', select:'channelNumber lastMessage'})
    .populate({path:'groups', select:'channelNumber lastMessage channelName'});

    res.status(200).json({
        status:"success",
        user:currentUser
    })
})

exports.getUserChannel = catchAsync( async(req, res, next)=>{
    const currentChannel = await Channel.findOne({channelNumber:req.params.channelNumber})
    if(!currentChannel.members.includes(req.user._id)){
        return next(new AppError("You are not a member of this group.", 401))   
    }
    res.status(200).json({
        status:'success',
        channel: currentChannel
    })
})
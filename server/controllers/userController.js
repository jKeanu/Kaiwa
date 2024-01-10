import User from '../models/userModel.js';
import Channel from '../models/channelModel.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/appError.js';
import multer from 'multer';
import sharp from 'sharp';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';


const filterObj = (obj, ...allowedfields)=>{
    const newObj = {}
    //Object.keys(obj) this would return an array that contains the keys of the objects
    Object.keys(obj).forEach(el=>{
       if (allowedfields.includes(el)) newObj[el] = obj[el]
    })
    return newObj
}

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

export const uploadProfileImage = upload.single('profileImage')       

export const resizeUserPhoto = catchAsync(async (req, res, next) => {
    if (!req.file) return next();
    req.file.filename = `user-${req.user.id}.jpeg`;
    //buffer is the raw binary data of the uploaded image file,

    const buffer = await sharp(req.file.buffer)
        .resize({height:500, width:500, fit:"contain"})
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toBuffer()

    const params = {
        Bucket: process.env.BUCKET_NAME,
        Key: req.file.filename,
        Body: buffer,
        ContentType: req.file.mimetype,
    }

    const command = new PutObjectCommand(params)
    await s3.send(command)
    next();
});

export const updateUser = catchAsync(async(req, res, next)=>{
    if (req.body.password || req.body.passwordConfirm){
        return next(new AppError('This route is not for password updates.', 400))
    }

    const filteredBody = filterObj(req.body, 'displayName', 'friendTag')
    if(req.file){
        filteredBody.photo = req.file.filename
    }
    //We can run validators since the passwordConfirm validator only works on create or save.
    const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {new:true, runValidators:true})
    res.status(200).json({
        status:'success',
        data:{
            user: updatedUser
        }
    })
})

export const getMe = catchAsync(async(req, res, next)=>{
    //Since we only need to populate the group and friend channel when getting
    //the current logged information, we can just populate all of them here.
    const currentUser = await User.findById(req.user._id).select('-__v')
    .populate({path:'friends.friend', select:'displayName friendTag photo'})
    .populate({path:'friends.channel', select:'channelNumber lastMessage'})
    .populate({path:'groups', select:'channelNumber lastMessage channelName photo'});

    res.status(200).json({
        status:"success",
        user:currentUser
    })
})

export const getUserChannel = catchAsync( async(req, res, next)=>{
    const currentChannel = await Channel.findOne({channelNumber:req.params.channelNumber})
    if(!currentChannel.members.includes(req.user._id)){
        return next(new AppError("You are not a member of this group.", 401))   
    }
    res.status(200).json({
        status:'success',
        channel: currentChannel
    })
})
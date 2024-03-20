import User from '../models/userModel.js';
import Channel from '../models/channelModel.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/appError.js';
import multer from 'multer';
import sharp from 'sharp';
import { S3Client, PutObjectCommand, DeleteObjectCommand} from '@aws-sdk/client-s3';
import dotenv from'dotenv'
//although we have already configure the dotenv in the app.js we have to configure it here as well
dotenv.config({ path: './config.env' });

const bucketName = process.env.BUCKET_NAME
const bucketRegion = process.env.BUCKET_REGION
const accessKey = process.env.ACCESS_KEY
const secretAccessKey = process.env.SECRET_ACCESS_KEY
const cloudfrontDomainName = process.env.CLOUDFRONT_DOMAIN_NAME


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
        accessKeyId: accessKey,
        secretAccessKey: secretAccessKey
    },
    region: bucketRegion
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

//the profileImage is the name of the input in html
export const uploadProfileImage = upload.single('profileImage')       

export const resizeUserPhoto = catchAsync(async (req, res, next) => {
    if (!req.file) return next();
    if(req.body.currPhoto==='default.jpeg'){
        req.file.filename = `user-profile-${req.user.id}-v1.jpeg`
        const buffer = await sharp(req.file.buffer)
            .resize({height:250, width:250, fit:"cover"})
            .toFormat('jpeg')
            .jpeg({ quality: 90 })
            .toBuffer()
        const params = {
            Bucket: bucketName,
            Key: req.file.filename,
            Body: buffer,
            ContentType: req.file.mimetype,
        }
        const command = new PutObjectCommand(params)
        await s3.send(command)
        await User.findByIdAndUpdate(req.user.id, {photo:req.file.filename}, {new:true, runValidators:true})
        next()
    }else{
        const versionRegex = /-v(\d+)\.jpeg$/
        // Extract the current version number, increment it, and generate the new filename
        const newVersionNumber = parseInt(req.body.currPhoto.match(versionRegex)[1], 10) + 1;
        req.file.filename = req.body.currPhoto.replace(versionRegex, `-v${newVersionNumber}.jpeg`);
        //buffer is the raw binary data of the uploaded image file,
        const buffer = await sharp(req.file.buffer)
            .resize({height:250, width:250, fit:"cover"})
            .toFormat('jpeg')
            .jpeg({ quality: 90 })
            .toBuffer()
        const params = {
            Bucket: bucketName,
            Key: req.file.filename,
            Body: buffer,
            ContentType: req.file.mimetype,
        }
        const command = new PutObjectCommand(params)
        await s3.send(command)
        const deleteCommand = new DeleteObjectCommand({Key:req.body.currPhoto, Bucket:bucketName})
        await s3.send(deleteCommand)
        await User.findByIdAndUpdate(req.user.id, {photo:req.file.filename}, {new:true, runValidators:true})
        next()
    };
});

export const updateUser = catchAsync(async(req, res, next)=>{
    if (req.body.password || req.body.passwordConfirm){
        return next(new AppError('This route is not for password updates.', 400))
    }
    
    const filteredBody = filterObj(req.body, 'displayName', 'friendTag')
    //We can run validators since the passwordConfirm validator only works on create or save.
    const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {new:true, runValidators:true})
        .select('-groups -friends -passwordChangedAt -__v')
    const updatedUserObject = updatedUser.toObject()
    if(req.file){
        updatedUserObject.photoUrl = `${process.env.CLOUDFRONT_DOMAIN_NAME}/${req.file.filename}`
    }
    res.status(200).json({
        status:'success',
        user: updatedUserObject
    })
})

export const getMe = catchAsync(async(req, res, next)=>{
    //Since we only need to populate the group and friend channel when getting
    //the current logged information, we can just populate all of them here.
    const currentUser = await User.findById(req.user._id).select('-__v')
        .populate({path:'friends.friend', select:'displayName friendTag photo status'})
        .populate({path:'friends.channel', select:'channelNumber lastMessage formattedLastMessage channelType'})
        .populate({path:'groups', select:'channelNumber lastMessage channelName photo formattedLastMessage channelType'})

    const currentUserObject = currentUser.toObject()
    currentUserObject.photoUrl = `${cloudfrontDomainName}/${currentUserObject.photo}`

    //We need to get the signed url of each images of our friend in s3
    for (const friend of currentUserObject.friends){
        friend.friend.photoUrl = `${cloudfrontDomainName}/${friend.friend.photo}`
    }
    //And also the photo of the group channel
    for (const group of currentUserObject.groups){
        group.photoUrl = `${cloudfrontDomainName}/${group.photo}`
    }
    res.status(200).json({
        status:"success",
        user:currentUserObject
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
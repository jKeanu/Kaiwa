import mongoose from 'mongoose';
import User from '../models/userModel.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/appError.js';
import Channel from '../models/channelModel.js';
import Chat from '../models/chatModel.js';
import { MongoServerError } from 'mongodb';
import multer from 'multer';
import { S3Client } from '@aws-sdk/client-s3';
import { DeleteObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import sharp from 'sharp';

const bucketName = process.env.BUCKET_NAME;
const bucketRegion = process.env.BUCKET_REGION;
const accessKey = process.env.ACCESS_KEY;
const secretAccessKey = process.env.SECRET_ACCESS_KEY;
const cloudfrontDomainName = process.env.CLOUDFRONT_DOMAIN_NAME;

const filterObj = (obj, ...allowedfields) => {
    const newObj = {};
    //Object.keys(obj) this would return an array that contains the keys of the objects
    Object.keys(obj).forEach((el) => {
        if (allowedfields.includes(el)) newObj[el] = obj[el];
    });
    return newObj;
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
export const getGroupChannel = catchAsync(async (req, res, next) => {
    const groupChannel = await Channel.findOne({
        _id: req.params.groupId,
        channelType: 'Group',
        members: { $in: [req.user._id] },
    });
    if (!groupChannel) {
        return next(new AppError('You are not permitted to perform this request.', 401));
    }
    res.status(200).json({
        status: 'success',
        data: {
            group: groupChannel,
        },
    });
});

export const createGroupChannel = catchAsync(async (req, res, next) => {
    if (!req.body.members.includes(req.user._id.toString())) {
        return next(new AppError('The creator of the group should be included in the group.', 400));
    }
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        //since create query accepts an array OR as a spread, we need to use the array
        //if we don't, it would see the {session} as another entry.
        const newChannel = await Channel.create(
            [
                {
                    channelType: 'Group',
                    groupLeader: req.user._id,
                    channelName: req.body.channelName,
                    members: req.body.members,
                },
            ],
            { session }
        );
        //push the newly created channel id to the members groups field.
        const updateStatus = await User.updateMany(
            {
                _id: {
                    $in: req.body.members,
                },
            },
            {
                $push: {
                    groups: newChannel[0]._id,
                },
            },
            { session }
        );
        //check if all users listed has been updated
        if (updateStatus.modifiedCount !== req.body.members.length) {
            await session.abortTransaction();
            return next(new AppError('One or more of the user is invalid', 400));
        }
        await session.commitTransaction();
        res.status(201).json({
            status: 'success',
            newChannel: newChannel[0],
        });
    } catch (err) {
        await session.abortTransaction();
        //errors in global error handler middleware
        next(err);
    } finally {
        await session.endSession();
    }
});

const s3 = new S3Client({
    credentials: {
        accessKeyId: accessKey,
        secretAccessKey: secretAccessKey,
    },
    region: bucketRegion,
});

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image')) {
        cb(null, true);
    } else {
        cb(new AppError('Please upload an image only file.', 400), false);
    }
};

const upload = multer({
    fileFilter: multerFilter,
    storage: multerStorage,
});

export const uploadGroupPhoto = upload.single('groupProfileImage');

export const resizeGroupPhoto = catchAsync(async (req, res, next) => {
    if (!req.file) return next();
    if (req.body.currPhoto === 'default.jpeg') {
        req.file.filename = `group-profile-${req.params.groupId}-v1.jpeg`;
        const buffer = await sharp(req.file.buffer)
            .resize({ height: 150, width: 150, fit: 'cover' })
            .toFormat('jpeg')
            .jpeg({ quality: 90 })
            .toBuffer();
        const params = {
            Bucket: bucketName,
            Key: req.file.filename,
            Body: buffer,
            ContentType: req.file.mimetype,
        };
        const command = new PutObjectCommand(params);
        const currChannel = await Channel.findOneAndUpdate(
            { _id: req.params.groupId, groupLeader: req.user._id },
            { photo: req.file.filename },
            { new: true, runValidators: true }
        );
        if (!currChannel)
            return next(new AppError('You are not permitted to perform this request.', 401));
        await s3.send(command);
        // runValidators: true only applies validators only to fields that are explicitly
        // included in the update operation, not to all fields of the document.
        next();
    } else {
        const versionRegex = /-v(\d+)\.jpeg$/;
        // Extract the current version number, increment it, and generate the new filename
        const newVersionNumber = parseInt(req.body.currPhoto.match(versionRegex)[1], 10) + 1;
        req.file.filename = req.body.currPhoto.replace(versionRegex, `-v${newVersionNumber}.jpeg`);
        //buffer is the raw binary data of the uploaded image file,
        const buffer = await sharp(req.file.buffer)
            .resize({ height: 125, width: 125, fit: 'cover' })
            .toFormat('jpeg')
            .jpeg({ quality: 90 })
            .toBuffer();
        const params = {
            Bucket: bucketName,
            Key: req.file.filename,
            Body: buffer,
            ContentType: req.file.mimetype,
        };
        const currChannel = await Channel.findOneAndUpdate(
            { _id: req.params.groupId, groupLeader: req.user._id },
            { photo: req.file.filename },
            { new: true, runValidators: true }
        );
        if (!currChannel)
            return next(new AppError('You are not permitted to perform this request.', 401));
        const command = new PutObjectCommand(params);
        await s3.send(command);
        const deleteCommand = new DeleteObjectCommand({
            Key: req.body.currPhoto,
            Bucket: bucketName,
        });
        await s3.send(deleteCommand);
        next();
    }
});

export const updateGroupDetails = catchAsync(async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const filteredBody = filterObj(req.body, 'channelName');
        const updateGroupObject = await Channel.findOneAndUpdate(
            {
                _id: req.params.groupId,
                groupLeader: req.user._id,
            },
            filteredBody,
            { new: true, session: session, runValidators: true }
        )
            .select('photo channelName groupLeader')
            .lean();
        if (!updateGroupObject) {
            await session.abortTransaction();
            return next(new AppError('You are not permitted to perform this request.', 401));
        }
        updateGroupObject.photoUrl = `${cloudfrontDomainName}/${updateGroupObject.photo}`;
        updateGroupObject.groupLeader = undefined;
        await session.commitTransaction();
        res.status(200).json({
            status: 'success',
            group: updateGroupObject,
        });
    } catch (err) {
        await session.abortTransaction();
        next(err);
    } finally {
        await session.endSession();
    }
    //this filters out unwanted field names on the req.body
});

export const deleteGroup = catchAsync(async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const groupChannel = await Channel.findOneAndDelete({
            _id: req.params.groupId,
            channelType: 'Group',
            groupLeader: req.user._id,
        }).session(session);
        if (!groupChannel) {
            await session.abortTransaction();
            return next(new AppError('You are not permitted to perform this request.', 401));
        }
        const updateStatus = await User.updateMany(
            {
                _id: { $in: groupChannel.members },
            },
            {
                $pull: {
                    groups: groupChannel._id,
                },
            },
            { session }
        );
        //Delete all messages in the channel
        await Chat.deleteMany({ channel: groupChannel._id }).session(session);
        if (updateStatus.modifiedCount !== groupChannel.members.length) {
            await session.abortTransaction();
            return next(new AppError('One or more of the input is invalid', 400));
        }
        await session.commitTransaction();
        res.status(204).end();
    } catch (err) {
        await session.abortTransaction();
        next(err);
    } finally {
        await session.endSession();
    }
});

export const getGroupMembers = catchAsync(async (req, res, next) => {
    const groupChannel = await Channel.findOne({
        _id: req.params.groupId,
        channelType: 'Group',
        members: { $in: [req.user._id] },
    }).populate({ path: 'members', select: 'displayName friendTag photo' });
    if (!groupChannel) {
        return next(new AppError('You are not permitted to perform this request.', 401));
    }
    res.status(200).json({
        status: 'success',
        data: {
            members: groupChannel.members,
        },
    });
});

export const inviteMember = catchAsync(async (req, res, next) => {
    let retries = 3; // Maximum number of retries
    let delayTime = 1000; // Delay time in milliseconds
    const attemptOperation = async () => {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            //Check if the user that is being invited exists.
            const user = await User.findById(req.body.userId).session(session);
            if (!user) {
                await session.abortTransaction();
                return next(new AppError('User does not exists', 404));
            }
            const groupChannel = await Channel.findOne({
                _id: req.params.groupId,
                channelType: 'Group',
                $and: [
                    { members: { $in: [req.user._id] } }, // If current user is a member
                    { members: { $nin: [user._id] } }, // if the invited user is  not yet a member
                ],
            }).session(session);
            if (!groupChannel) {
                await session.abortTransaction();
                return next(
                    new AppError(
                        'You must be a member of the group and the user is not a member yet.',
                        403
                    )
                );
            }
            //Check if the logged in user is friends with the user that we're inviting in the group
            const findStatus = user.friends.find(
                (friend) =>
                    friend.friend.toString() === req.user._id.toString() &&
                    friend.status === 'Friend'
            );
            //If the findStatus does not exists it means that the logged in user is not friends with
            //the person he/she is inviting.
            if (!findStatus) {
                await session.abortTransaction();
                return next(new AppError('Friends with the user is required to invite.', 400));
            }
            //pushing the channel into the invited users groups
            user.groups.push(groupChannel._id);
            //updating the group member
            groupChannel.members.push(user._id);
            groupChannel.lastMessage = req.body.newTime;
            await groupChannel.save({ session });
            await user.save({ session, validateBeforeSave: false });
            await session.commitTransaction();
            res.status(200).json({
                status: 'success',
            });
        } catch (err) {
            if (err instanceof MongoServerError && err.code === 112 && retries > 0) {
                retries--;
                await delay(delayTime);
                await session.abortTransaction();
                return attemptOperation();
            }
            await session.abortTransaction();
            next(err);
        } finally {
            await session.endSession();
        }
    };
    await attemptOperation();
});

export const leaveGroup = catchAsync(async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const user = await User.findById(req.user._id).session(session);
        const groupChannel = await Channel.findOne({
            _id: req.params.groupId,
            channelType: 'Group',
            members: { $in: [user._id] },
        }).session(session);
        if (!groupChannel) {
            await session.abortTransaction();
            return next(new AppError('You are not permitted to perform this request.', 401));
        }
        if (user._id.toString() === groupChannel.groupLeader.toString()) {
            await session.abortTransaction();
            return next(new AppError('Assign a new group leader before you leave the group.', 400));
        }
        //remove the group channel from the user's groups
        user.groups.pull(groupChannel._id);
        //remove the user from the group's members
        groupChannel.members.pull(user._id);
        await user.save({ session, validateBeforeSave: false });
        await groupChannel.save({ session });
        await session.commitTransaction();
        res.status(204).end();
    } catch (err) {
        await session.abortTransaction();
        next(err);
    } finally {
        await session.endSession();
    }
});

export const changeGroupLeader = catchAsync(async (req, res, next) => {
    const groupChannel = await Channel.findOneAndUpdate(
        {
            _id: req.params.groupId,
            channelType: 'Group',
            $and: [{ members: { $in: [req.user._id] } }, { members: { $in: [req.body.userId] } }],
            groupLeader: req.user._id,
        },
        {
            $set: {
                groupLeader: req.body.userId,
            },
        }
    );
    if (!groupChannel) {
        return next(new AppError('You are not permitted to perform this request.', 401));
    }
    res.status(200).json({
        status: 'success',
    });
});

import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/appError.js';
import Channel from '../models/channelModel.js';
import Chat from '../models/chatModel.js';

const cloudfrontDomainName = process.env.CLOUDFRONT_DOMAIN_NAME;

export const getUserChannel = catchAsync(async (req, res, next) => {
    const channelObject = await Channel.findOne({
        channelNumber: req.params.channelNumber,
        members: { $in: [req.user._id] },
    })
        .populate({ path: 'members', select: 'photo displayName friendTag status' })
        .lean();
    if (!channelObject) {
        return next(new AppError('You are not permitted to perform this request.', 401));
    }
    channelObject.photoUrl = `${cloudfrontDomainName}/${channelObject.photo}`;
    for (const member of channelObject.members) {
        member.photoUrl = `${cloudfrontDomainName}/${member.photo}`;
    }
    res.status(200).json({
        status: 'success',
        channel: channelObject,
    });
});

export const getChannelMessages = catchAsync(async (req, res, next) => {
    const limit = parseInt(req.query.limit) || 15;
    const skip = parseInt(req.query.skip) || 0;
    const currentChannel = await Channel.findOne({
        channelNumber: req.params.channelNumber,
        members: { $in: [req.user._id] },
    });
    if (!currentChannel) {
        return next(new AppError('You are not permitted to perform this request.', 401));
    }
    const channelMessages = await Chat.find({ channel: currentChannel._id })
        .skip(skip)
        .limit(limit)
        .sort({ time: -1 })
        .populate({ path: 'sender', select: 'displayName photo friendTag' })
        .lean();
    for (const message of channelMessages) {
        message.sender.photoUrl = `${cloudfrontDomainName}/${message.sender.photo}`;
    }
    res.status(200).json({
        status: 'success',
        messages: channelMessages,
    });
});

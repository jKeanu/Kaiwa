import express from 'express';
import * as authController from '../controllers/authController.js';
import * as channelController from '../controllers/channelController.js';
import rateLimit from 'express-rate-limit';

const router = express.Router();

router.use(authController.protect);

const getChannelLimit = rateLimit({
    max: 500,
    windowMs: 1000*60*60*3
})

const getChannelMessagesLimt = rateLimit({
    max: 2000,
    windowMs: 1000*60*60*2
})

router.get('/:channelNumber', getChannelLimit, channelController.getUserChannel);

router.get('/:channelNumber/messages', getChannelMessagesLimt, channelController.getChannelMessages)

export default router;
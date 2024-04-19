import express from 'express';
import * as authController from '../controllers/authController.js';
import * as channelController from '../controllers/channelController.js';
import rateLimit from 'express-rate-limit';

const router = express.Router();

const getChannelLimiter = rateLimit({
    max: 100,
    windowMs: 1000*60*60*2
})

const getChannelMessageLimiter = rateLimit({
    max: 300,
    windowMs: 1000*60*60*2
})

router.use(authController.protect);

router.route('/:channelNumber')
    .get(channelController.getUserChannel);

router.route('/:channelNumber/messages')
    .get(channelController.getChannelMessages)


export default router;
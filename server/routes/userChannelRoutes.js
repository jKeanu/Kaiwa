import express from 'express';
import * as authController from '../controllers/authController.js';
import * as channelController from '../controllers/channelController.js';

const router = express.Router();

router.use(authController.protect);

router.route('/:channelNumber')
    .get(channelController.getUserChannel);

router.route('/:channelNumber/messages')
    .get(channelController.getChannelMessages)


export default router;
import express from 'express';
import * as friendController from '../controllers/friendController.js';
import rateLimit from 'express-rate-limit';
import verifyUserIdentity from '../middlewares/verifyUserIdentity.js';

const router = express.Router();

const friendLimiter = rateLimit({
    max: 15,
    windowMs: 1000 * 60 * 60 * 2,
    message: 'Too many requests have been detected, please try again later.',
});

router.use(verifyUserIdentity);

router.route('/:friendId/unfriend').delete(friendController.unfriend);

router.route('/:friendId/decline').delete(friendController.declineFriend);

router.use(friendLimiter);

router.route('/').get(friendController.getUserFriends).post(friendController.addFriend);

router.route('/:friendId').get(friendController.getFriend);

router.route('/:friendId/accept').patch(friendController.acceptFriend);

export default router;

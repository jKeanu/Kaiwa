import express from 'express';
import * as authController from '../controllers/authController.js';
import * as friendController from '../controllers/friendController.js';

const router = express.Router();

router.use(authController.protect);

router.route('/')
    .get(friendController.getUserFriends)
    .post(friendController.addFriend);

router.route('/:friendId')
    .get(friendController.getFriend);

router.route('/:friendId/unfriend')
    .delete(friendController.unfriend);

router.route('/:friendId/decline')
    .delete(friendController.declineFriend);

router.route('/:friendId/accept')
    .patch(friendController.acceptFriend);

export default router;
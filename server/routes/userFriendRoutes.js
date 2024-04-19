import express from 'express';
import * as authController from '../controllers/authController.js';
import * as friendController from '../controllers/friendController.js';
import rateLimit from 'express-rate-limit';

const router = express.Router();

const friendLimiter = rateLimit({
    max: 15,
    windowMs: 1000*60*60*2
})

router.use(authController.protect);


router.route('/:friendId/unfriend')
    .delete(friendController.unfriend);

router.route('/:friendId/decline')
    .delete(friendController.declineFriend);

router.use(friendLimiter)

router.route('/')
    .get(friendController.getUserFriends)
    .post(friendController.addFriend);

router.route('/:friendId')
    .get(friendController.getFriend);
    
router.route('/:friendId/accept')
    .patch(friendController.acceptFriend);

export default router;
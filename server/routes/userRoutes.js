import express from 'express';
import * as authController from '../controllers/authController.js';
import * as userController from '../controllers/userController.js';
import rateLimit from 'express-rate-limit';
import verifyUserIdentity from '../middlewares/verifyUserIdentity.js';

const router = express.Router();

const getMeLimiter = rateLimit({
    max: 150,
    windowMs: 1000 * 60 * 60 * 3,
});

const userSettLimiter = rateLimit({
    limit: 3,
    windowMs: 1000 * 60 * 60 * 12,
    message: 'Too many profile change attempts, please try again later.',
    skipFailedRequests: true,
});

const passwordChangeLimiter = rateLimit({
    limit: 3,
    windowMs: 1000 * 60 * 60 * 12,
    message: 'Too many profile change attempts, please try again later.',
    skipFailedRequests: true,
});

router.use(verifyUserIdentity);

router.patch(
    '/updateMe',
    userSettLimiter,
    userController.uploadProfileImage,
    userController.resizeUserPhoto,
    userController.updateUser
);

router.patch('/changepassword', passwordChangeLimiter, authController.changePassword);
router.get('/me', getMeLimiter, userController.getMe);

export default router;

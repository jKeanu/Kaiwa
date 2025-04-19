import express from 'express';
import * as authController from '../controllers/authController.js';
import rateLimit from 'express-rate-limit';
import verifyRefresh from '../middlewares/verifyRefresh.js';
import { isLoggedIn } from '../controllers/authController.js';

const router = express.Router();

const loginLimiter = rateLimit({
    max: 8,
    windowMs: 60 * 30 * 1000,
    message: 'Too many login attempts, please try again later.',
});

const registerLimiter = rateLimit({
    max: 3,
    windowMs: 60 * 1000 * 60 * 2,
    message: 'Too many registration attempts detected, please try again later.',
    skipFailedRequests: true,
});

const forgotPasswordLimiter = rateLimit({
    limit: 3,
    windowMs: 1000 * 60 * 60 * 12,
    message: 'Too many forgot password attempts, please try again later.',
    skipFailedRequests: true,
});

const resetPasswordLimiter = rateLimit({
    limit: 10,
    windowMs: 1000 * 60 * 60 * 6,
    message: 'Too many reset password attempts, please try again later.',
});

const authCheckLimit = rateLimit({
    max: 50,
    windowMs: 1000 * 60 * 60 * 6,
    message: 'Too many request attempts, please try again later.',
});

const refreshLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5,
    message: 'Too many refresh attempts, please try again later.',
});

router.post('/register', registerLimiter, authController.signup);
router.post('/login', loginLimiter, authController.userLogin);
router.post('/logout', authController.userLogout);

//Password reset
router.post('/forgotPassword', forgotPasswordLimiter, authController.forgotPassword);
router.patch('/resetPassword/:token', resetPasswordLimiter, authController.resetPassword);

router.get('/check', authCheckLimit, verifyRefresh, isLoggedIn);
router.post('/refresh', refreshLimiter, verifyRefresh, authController.tokenRefresh);
export default router;

import express from 'express';
import * as authController from '../controllers/authController.js';
import * as userController from '../controllers/userController.js';
import rateLimit from 'express-rate-limit';


const router = express.Router();

const getMeLimiter = rateLimit({
    max: 150,
    windowMs: 1000*60*60*3
})

const loginLimiter = rateLimit({
    max: 8,
    windowMs: 60*30*1000,
    message: 'Too many login attempts, please try again later.'
})
  
const registerLimiter = rateLimit({
    max: 3,
    windowMs: 60*1000*60*2,
    message: 'Too many registration attempts detected, please try again later.',
    skipFailedRequests: true
})

const userSettLimiter = rateLimit({
    limit: 3,
    windowMs: 1000*60*60*12,
    message: 'Too many profile change attempts, please try again later.',
    skipFailedRequests: true
})

const passwordChangeLimiter = rateLimit({
    limit: 3,
    windowMs: 1000*60*60*12,
    message: 'Too many profile change attempts, please try again later.',
    skipFailedRequests: true
})

const forgotPasswordLimiter = rateLimit({
    limit: 3,
    windowMs: 1000*60*60*12,
    message: 'Too many forgot password attempts, please try again later.',
    skipFailedRequests: true
})

const resetPasswordLimiter = rateLimit({
    limit: 10,
    windowMs: 1000*60*60*6,
    message: 'Too many reset password attempts, please try again later.'
})

router.post('/register',  registerLimiter, authController.signup)
router.post('/login', loginLimiter, authController.login)
router.get('/auth')

//Password reset
router.post('/forgotPassword', forgotPasswordLimiter, authController.forgotPassword)
router.patch('/resetPassword/:token', resetPasswordLimiter, authController.resetPassword)

router.use(authController.protect);

router.patch('/updateMe',
    userSettLimiter,
    userController.uploadProfileImage,
    userController.resizeUserPhoto,
    userController.updateUser);

router.patch('/changepassword', passwordChangeLimiter, authController.changePassword);
router.get('/me', getMeLimiter, userController.getMe);

export default router;
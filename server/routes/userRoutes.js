import express from 'express';
import * as authController from '../controllers/authController.js';
import * as userController from '../controllers/userController.js';
import rateLimit from 'express-rate-limit';


const router = express.Router();

const useSettLimiter = rateLimit({
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

router.post('/register', authController.signup);
router.post('/login', authController.login);

router.use(authController.protect);

router.patch('/updateMe',
    useSettLimiter,
    userController.uploadProfileImage,
    userController.resizeUserPhoto,
    userController.updateUser);
    
router.patch('/changepassword', passwordChangeLimiter, authController.changePassword);
router.get('/me', userController.getMe);

export default router;
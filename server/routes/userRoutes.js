import express from 'express';
import * as authController from '../controllers/authController.js';
import * as userController from '../controllers/userController.js';

const router = express.Router();

router.post('/register', authController.signup);
router.post('/login', authController.login);

router.use(authController.protect);

router.patch('/updateMe', userController.updateUser);
router.patch('/changepassword', authController.changePassword);
router.get('/me', userController.getMe);

export default router;

import express from 'express';
import rateLimit from 'express-rate-limit';
import { isLoggedIn } from '../controllers/authController';

const router = express.Router();

const authCheckLimit = rateLimit({
    max: 100,
    windowMs: 1000*60*60*6,
    message: 'Too many request attempts, please try again later.',
})


router.get('/check', 
    authCheckLimit, 
    isLoggedIn)

export default router
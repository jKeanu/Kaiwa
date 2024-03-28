import express from 'express';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';
import compression from 'compression';
import cors from 'cors';
import globalHandleError from './controllers/errorController.js';
import userRouter from './routes/userRoutes.js';
import groupRouter from './routes/groupRoutes.js';
import userFriendRouter from './routes/userFriendRoutes.js';
import userGroupRouter from './routes/userGroupRoutes.js';
import userChannelRouter from './routes/userChannelRoutes.js';
import dotenv from'dotenv'
dotenv.config({ path: './config.env' });
const app = express();


app.use(cors());
app.options('*', cors());

// Set Security HTTP headers
app.use(helmet());

// Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Limit requests from the same API
// const limiter = rateLimit({
//   max: 100,
//   // Milliseconds to an hour
//   windowMs: 60 * 60 * 1000,
//   message: 'Too many requests from this IP, please try again in an hour',
// });
// app.use('/api', limiter);


const loginLimiter = rateLimit({
  max: 15,
  windowMs: 60*30*1000,
  message: 'Too many login attempts, please try again later.',
  skipSuccessfulRequests: true
})

const registerLimiter = rateLimit({
  max: 3,
  windowMs: 60*1000*60*2,
  message: 'Too many registration attempts detected, please try again later.',
  skipFailedRequests: true
})

app.use('/api/v1/users/login', loginLimiter)
app.use('/api/v1/users/register', registerLimiter)

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Data sanitization against NoSQL query
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());
app.use(compression());

app.use('/api/v1/users', userRouter);
app.use('/api/v1/groups', groupRouter);
app.use('/api/v1/channels', userChannelRouter);
app.use('/api/v1/me/friends', userFriendRouter);
app.use('/api/v1/me/groups', userGroupRouter);
app.use(globalHandleError);

export default app;
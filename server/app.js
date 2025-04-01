import path from 'path';
import 'dotenv/config.js'
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url); // get the resolved path to the file
const __dirname = path.dirname(__filename); // get the name of the directory
import express from 'express';
import morgan from 'morgan';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import compression from 'compression';
import cors from 'cors';
import globalHandleError from './controllers/errorController.js';
import authRouter from './routes/authRoutes.js';
import userRouter from './routes/userRoutes.js';
import groupRouter from './routes/groupRoutes.js';
import userFriendRouter from './routes/userFriendRoutes.js';
import userGroupRouter from './routes/userGroupRoutes.js';
import userChannelRouter from './routes/userChannelRoutes.js';
import cookieParser from 'cookie-parser';

const app = express();

app.set('trust proxy', 1)

// Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.use(express.static(path.join(__dirname, 'public')));

const corsOptions = {
  origin: process.env.NODE_ENV === 'production' ? 
  [process.env.CLIENT_URL_PROD, process.env.SUB_CLIENT_URL_PROD]:
  process.env.CLIENT_URL_DEV,
  credentials: true,
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
 
// Set Security HTTP headersc
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      baseUri: ["'self'"],
      fontSrc: ["'self'", 'https:', 'data:'],
      formAction: ["'self'"],
      frameAncestors: ["'self'"],
      imgSrc: ["'self'", 'data:'],
      objectSrc: ["'none'"],
      scriptSrc: ["'self'"], //Does not allow inline scripts
      scriptSrcAttr: ["'none'"],
      styleSrc: ["'self'", 'https:'], //Does not allow inline styles
      requireTrustedTypesFor: ['script', 'style'],
    },
  },
  referrerPolicy: { policy: 'no-referrer' },
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  permittedCrossDomainPolicies: { permittedPolicies: 'none' }
}));

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser())

// Data sanitization against NoSQL query
app.use(mongoSanitize());

app.use(compression());

app.use('/api/v1/auth', authRouter)
app.use('/api/v1/users', userRouter);
app.use('/api/v1/groups', groupRouter);
app.use('/api/v1/channels', userChannelRouter);
app.use('/api/v1/me/friends', userFriendRouter);
app.use('/api/v1/me/groups', userGroupRouter);
app.use(globalHandleError);

export default app;
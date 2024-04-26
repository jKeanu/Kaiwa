import express from 'express';
import dotenv from 'dotenv'
dotenv.config({ path: './config.env' });
import morgan from 'morgan';
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
import path from 'path';
import { fileURLToPath } from 'url';


const app = express();

const corsOptions = {
  origin: 'http://localhost:5173'
}

app.use(cors(corsOptions));
app.options('*', cors());
 
const __filename = fileURLToPath(import.meta.url); // get the resolved path to the file
const __dirname = path.dirname(__filename); // get the name of the directory

app.use(express.static(path.join(__dirname, './public')));
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
      scriptSrc: ["'self'"],
      scriptSrcAttr: ["'none'"],
      styleSrc: ["'self'", 'https:'],
      requireTrustedTypesFor: ['script', 'style'],
    },
  },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  permittedCrossDomainPolicies: { permittedPolicies: 'none' },
  xssFilter: true
}));

// Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

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
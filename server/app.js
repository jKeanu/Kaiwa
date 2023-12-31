const express = require('express');
const morgan = require('morgan')
const rateLimit = require('express-rate-limit')
const helmet = require('helmet')
const mongoSanitize = require('express-mongo-sanitize')
const xss = require('xss-clean')
const cookieParser = require('cookie-parser')
const compression = require('compression');
const cors = require('cors')

const globalHandleError = require('./controllers/errorController')
const userRouter = require('./routes/userRoutes');
const groupRouter = require('./routes/groupRoutes')
const friendRouter = require('./routes/friendRoutes')


const app = express();

// app.enable('trust proxy');

app.use(cors())
//app.options('/api/v1/tours/:id, cors()),
app.options('*', cors())

//set Security HTTP headers
app.use(helmet())

//Development logging
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

//Limit erquests from same API
// const limiter = rateLimit({
//     max: 100,
//     //millisecond to  hour
//     windowMs: 60*60*1000 ,
//     message: 'Too many request from this IP, please try again in an hour'
// })
// app.use('/api',limiter);
app.use(express.json({limit:'10kb'}));
app.use(express.urlencoded({extended: true, limit: '10kb'}))

//Data sanitization against NoSQL query
app.use(mongoSanitize());

//Data sanitization against XSS
app.use(xss())
app.use(compression());


app.use('/api/v1/users', userRouter);
app.use('/api/v1/groups', groupRouter);
app.use('/api/v1/my/friends', friendRouter);
app.use(globalHandleError)


module.exports = app;
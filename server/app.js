const express = require('express');
const path = require('path')
const helmet = require('helmet');
const cors = require('cors')
const mongoSanitize = require('express-mongo-sanitize');
const globalHandleError = require('./controllers/errorController')
const AppError = require('./utils/appError')
const userRouter = require('./routes/userRoutes');


const app = express();


app.use(express.json({limit:'10kb'}));
app.use(mongoSanitize());
app.use(express.urlencoded({extended: true, limit: '10kb'}))
app.use(helmet());
app.use('/api/v1/users', userRouter);
app.use(globalHandleError)


module.exports = app;
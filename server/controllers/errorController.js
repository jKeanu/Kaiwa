import AppError from '../utils/appError.js';
import { logger } from '../socketServer.js';


const handleCastErrorDB = err =>{
    //err.value is the value we passed in the /:id, while the err.path is where we are trying to match 
    //that value in this case _id of the document
    const message = `Invalid ${err.path}:${err.value}`
    return new AppError(message, 400)
}

const handleDuplicateFieldsDB = err => {
    const {email, displayName, friendTag} = err.keyValue
    let message
    if(email){
        message = `The email ${email} is already taken.`
    }else if(displayName&&friendTag){
        message = `The user with display name ${displayName} with friend tag ${friendTag} is already taken.`
    }
    return new AppError(message, 400);
};


const handleValidationErrorDB = err => {
    if(Object.keys(err.errors).includes("members.1")){
        return new AppError("Invalid Input", 400)
    }
    const errors = Object.values(err.errors).map(el => el.message);
    const message = `Invalid input. ${errors.join('. ')}`;
    return new AppError(message, 400);
};

const handleJWTError = () =>
  new AppError('Invalid token. Please log in again!', 401);

const handleJWTExpiredError = () =>
  new AppError('Your token has expired! Please log in again.', 401);

const sendErrorDev=(err, req, res) => {
    logger.error('Uncaught error', {message:err.message, stack:err.stack})
    console.log('ERROR: ', err)
    res.status(err.statusCode).json({
        status: err.status,
        err: err,
        message: err.message,
        stack: err.stack
    })
}

const sendErrorProd=(err, req, res)=>{
    //If err.isOperational returned true, it means that we handled the error using AppError.
    if(err.isOperational){
        return res.status(err.statusCode).json({
            status:err.status,
            message: err.message
        })
    }
    //This line would execute if there was an unhandled error that we have not caught.
    logger.error('Uncaught error', {message:err.message, stack:err.stack})
    return res.status(500).json({
        status:'error',
        message:'Something went very wrong'
    })
}


export default function globalHandleError(err, req, res, next){
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';
    if (process.env.NODE_ENV === 'development'){
        sendErrorDev(err, req, res)
    }else if(process.env.NODE_ENV === 'production'){
        let error = {...err};
        //Since not all properties of the 'Error' object are enumerable (message and name included)
        //we need to manually set the error.message and error.name
        error.message = err.message
        error.name = err.name
        if (error.name === 'CastError') error = handleCastErrorDB(error);
        //Handles duplicates, i.e. If a user signed up using an email that already exists in the database.
        if (error.code === 11000) error = handleDuplicateFieldsDB(error);
        //Validation errors
        if (error.name === 'ValidationError')error = handleValidationErrorDB(error);
        //If the token is invalid or manipulated.
        if (error.name === 'JsonWebTokenError') error = handleJWTError();
        //If the token expired
        if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();
        sendErrorProd(error, req, res);
    }
}
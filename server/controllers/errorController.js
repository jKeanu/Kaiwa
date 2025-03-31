import AppError from '../utils/appError.js';
import { errLogger } from '../utils/cloudwatchConfig.js';


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
    //This executes if there is a modified id on the members when creating a group. 1 indicates that it is in index 1
    //This should be in cast error but for some reason when this error occurs it goes into validation error
    // if(Object.keys(err.errors).includes("members.1")){
    //     return new AppError("Invalid Input", 400)
    // }
    //During validation error, the validation errors are placed in err.errors
    const errors = Object.values(err.errors).map(el => el.message);
    const message = `Invalid input. ${errors.join('. ')}`;
    return new AppError(message, 400);
};

const handleJWTError = () =>
  new AppError('Invalid token. Please log in again!', 401);

const handleJWTExpiredError = () =>
  new AppError('Your token has expired! Please log in again.', 401);

const sendErrorDev=(err, req, res) => {
    errLogger.error('Uncaught error', {message:err.message, stack:err.stack})
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
    errLogger.error('Uncaught error', {message:err.message, stack:err.stack})
    return res.status(500).json({
        status:'error',
        message:'Something went very wrong'
    })
}


export default function globalHandleError(err, req, res, _next){
    let currErr = err
    currErr.statusCode = currErr.statusCode || 500;
    currErr.status = currErr.status || 'error';
    if (process.env.NODE_ENV === 'development'){
        sendErrorDev(currErr, req, res)
    }else if(process.env.NODE_ENV === 'production'){
        if (currErr.name === 'CastError') currErr = handleCastErrorDB(currErr);
        //Handles duplicates, i.e. If a user signed up using an email that already exists in the database.
        if (currErr.code === 11000) currErr = handleDuplicateFieldsDB(currErr);
        //Validation errors
        if (currErr.name === 'ValidationError') currErr= handleValidationErrorDB(currErr);
        //If the token is invalid or manipulated.
        if (currErr.name === 'JsonWebTokenError') currErr = handleJWTError();
        //If the token expired
        if (currErr.name === 'TokenExpiredError') currErr = handleJWTExpiredError();
        sendErrorProd(currErr, req, res);
    }
}
import TOKEN_ERRORS from '../constants/tokenErrors.js';
import AppError from '../utils/appError.js';
import { errLogger } from '../utils/cloudwatchConfig.js';
import removeTokens from '../utils/removeTokens.js';

const handleCastErrorDB = (err) => {
    //err.value is the value we passed in the /:id, while the err.path is where we are trying to match
    //that value in this case _id of the document
    const message = `Invalid ${err.path}:${err.value}`;
    return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
    const { email, displayName, friendTag } = err.keyValue;
    let message;
    if (email) {
        message = `The email ${email} is already taken.`;
    } else if (displayName && friendTag) {
        message = `The user with display name ${displayName} with friend tag ${friendTag} is already taken.`;
    }
    return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
    //This executes if there is a modified id on the members when creating a group. 1 indicates that it is in index 1
    //This should be in cast error but for some reason when this error occurs it goes into validation error
    // if(Object.keys(err.errors).includes("members.1")){
    //     return new AppError("Invalid Input", 400)
    // }
    //During validation error, the validation errors are placed in err.errors
    const errors = Object.values(err.errors).map((el) => el.message);
    const message = `Invalid input. ${errors.join('. ')}`;
    return new AppError(message, 400);
};

const sendErrorDev = (err, req, res) => {
    errLogger.error('Uncaught error', { message: err.message, stack: err.stack });
    console.log('ERROR: ', err);
    res.status(err.statusCode).json({
        status: err.status,
        err: err,
        message: err.message,
        stack: err.stack,
    });
};

const handleTokenErrors = (err, res) => {
    const isExpired = err.name === 'TokenExpiredError';
    // A present tokenStatus indicates it is an instance of AppError.
    if (err.tokenStatus) {
        // We clear the cookies for refresh token errors.
        if (err.tokenStatus.includes('REFRESH_TOKEN')) {
            removeTokens(res);
        }
        return res.status(err.statusCode).json({
            status: err.status,
            code: err.tokenStatus,
            message: err.message,
        });
    } else {
        // Since we have already catched the errors for refresh token, it is always an intance of
        // Apperror
        return res.status(401).json({
            status: 'fail',
            code: isExpired ? TOKEN_ERRORS.EXPIRED_ACCESS : TOKEN_ERRORS.INVALID_ACCESS,
            message: isExpired ? 'Expired access token.' : 'Invalid access token.',
        });
    }
};

const sendErrorProd = (err, req, res) => {
    //If err.isOperational returned true, it means that we handled the error using AppError.
    if (err.isOperational) {
        return res.status(err.statusCode).json({
            status: err.status,
            message: err.message,
        });
    }
    //This line would execute if there was an unhandled error that we have not caught.
    errLogger.error('Uncaught error', { message: err.message, stack: err.stack });
    return res.status(500).json({
        status: 'error',
        message: 'Something went very wrong',
    });
};

export default function globalHandleError(err, req, res, _next) {
    let currErr = err;
    currErr.statusCode = currErr.statusCode || 500;
    currErr.status = currErr.status || 'error';
    // Both dev and prod error handling for token error is similar.
    if (err.tokenStatus || err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
        return handleTokenErrors(err, res);
    }
    if (process.env.NODE_ENV === 'development') {
        sendErrorDev(currErr, req, res);
    } else if (process.env.NODE_ENV === 'production') {
        if (currErr.name === 'CastError') currErr = handleCastErrorDB(currErr);
        //Handles duplicates, i.e. If a user signed up using an email that already exists in the database.
        if (currErr.code === 11000) currErr = handleDuplicateFieldsDB(currErr);
        //Validation errors
        if (currErr.name === 'ValidationError') currErr = handleValidationErrorDB(currErr);
        sendErrorProd(currErr, req, res);
    }
}

const AppError = require('../utils/appError')

const sendErrorDev=(err, req, res) => {
    res.status(err.statusCode).json({
        status: err.status,
        err: err,
        messsage: err.message,
        stack: err.stack
    })
}

module.exports = (err, req, res, next) =>{
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';
    if (process.env.NODE_ENV === 'development'){
        sendErrorDev(err, req, res)
    }
}
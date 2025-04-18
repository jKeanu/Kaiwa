class AppError extends Error {
    constructor(message, statusCode, tokenStatus = undefined) {
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true;
        this.tokenStatus = tokenStatus;
        Error.captureStackTrace(this, this.constructor);
    }
}

export default AppError;

import AppError from '../utils/appError.js';
import isRefreshPayload from '../utils/isRefreshPayload.js';
import catchAsync from '../utils/catchAsync.js';
import User from '../models/userModel.js';
import TOKEN_ERRORS from '../constants/tokenErrors.js';
import verifyToken from '../utils/verifyToken.js';

// We use catchAsync here even though we have try/catch inside, for better code readability
// Since we have db query and token verification (2 promises).
const verifyRefresh = catchAsync(async (req, res, next) => {
    if (!req.cookies || !req.cookies.refreshToken) {
        return next(
            new AppError(
                'The refresh token is either expired or missing.',
                401,
                TOKEN_ERRORS.MISSING_REFRESH
            )
        );
    }
    const refreshToken = req.cookies.refreshToken;
    // We use try and catch to catch token verification errors right away to separate it from
    // access errors in global error handler.
    try {
        const payload = await verifyToken(refreshToken, process.env.REFRESH_TOKEN_SECRET);
        if (!payload || !isRefreshPayload(payload)) {
            return next(
                new AppError('Invalid token structure.', 401, TOKEN_ERRORS.INVALID_REFRESH)
            );
        }
        const currUser = await User.findById(payload.userId).select('passwordChangedAt');
        if (!currUser) {
            return next(new AppError('Invalid refresh token.', 401, TOKEN_ERRORS.INVALID_REFRESH));
        }
        if (payload.iat && currUser.changedPasswordAfter(payload.iat)) {
            return next(
                new AppError(
                    'Outdated token, user recently changed password.',
                    401,
                    TOKEN_ERRORS.INVALID_REFRESH
                )
            );
        }
        req.refreshPayload = payload;
        return next();
        // We use catch here even though we have catchAsync wrapper function, because we need to catch the
        // the verification error for tokens here, since these errors reach the global handle error,
        // We have no way of distinguishing the verification error between access  and refresh token.
    } catch (err) {
        if (err instanceof Error) {
            if (err.name === 'TokenExpiredError') {
                return next(
                    new AppError('Expired refresh token.', 401, TOKEN_ERRORS.EXPIRED_REFRESH)
                );
            } else if (err.name === 'JsonWebTokenError') {
                return next(
                    new AppError('Invalid refresh token.', 401, TOKEN_ERRORS.INVALID_REFRESH)
                );
            }
        }
        return next(err);
    }
});

export default verifyRefresh;

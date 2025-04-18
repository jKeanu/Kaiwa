import TOKEN_ERRORS from '../constants/tokenErrors.js';
import User from '../models/userModel.js';
import AppError from '../utils/appError.js';
import catchAsync from '../utils/catchAsync.js';
import verifyToken from '../utils/verifyToken.js';

const verifyUserIdentity = catchAsync(async (req, res, next) => {
    let token;
    if (req.cookies && req.cookies.accessToken) {
        token = req.cookies.accessToken;
    }
    if (!token) {
        return next(
            new AppError(
                'The access token is either expired or missing.',
                401,
                TOKEN_ERRORS.MISSING_ACCESS
            )
        );
    }
    const decoded = await verifyToken(token, process.env.ACCESS_TOKEN_SECRET);
    if (!decoded) {
        return next(new AppError('Invalid token access.', 401, TOKEN_ERRORS.INVALID_ACCESS));
    }
    const currentUser = await User.findById(decoded.userId).select('-friends -travelPlans -groups');
    if (!currentUser) {
        return next(new AppError('Invalid token access.', 401, TOKEN_ERRORS.INVALID_ACCESS));
    }
    if (decoded.iat && currentUser.changedPasswordAfter(decoded.iat)) {
        return next(
            new AppError(
                'Outdated token, user recently changed password.',
                401,
                TOKEN_ERRORS.INVALID_ACCESS
            )
        );
    }
    req.user = currentUser;
    next();
});

export default verifyUserIdentity;

import TOKEN_ERRORS from '../constants/tokenErrors.js';
import AppError from '../utils/appError.js';

// Since the protect middleware is enough to validate the access token we can just
// Place this controller after it in the routes to determine the status of the token
export const getAccessTokenStatus = (req, res, next) => {
    // Even though we know that after the protect there would be req.user present
    // This is only used for a more secure appraoch in case that there was an error that wasn't caught.
    if (!req.user) {
        return next(
            new AppError(
                'There was an error validating the token.',
                401,
                TOKEN_ERRORS.INVALID_ACCESS
            )
        );
    }
    res.status(204).end();
};

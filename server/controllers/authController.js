import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import User from '../models/userModel.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/appError.js';
import { Email } from '../utils/email.js';
import { errLogger } from '../utils/cloudwatchConfig.js';
import crypto from 'crypto';
import sanitizeObject from '../utils/sanitizeObj.js';
import verifyToken from '../utils/verifyToken.js';
import RefreshToken from '../models/refreshTokenModel.js';
import mongoose from 'mongoose';
import TOKEN_ERRORS from '../constants/tokenErrors.js';
import removeTokens from '../utils/removeTokens.js';
import isRefreshPayload from '../utils/isRefreshPayload.js';

function signAccessToken(userId) {
    const secret = process.env.ACCESS_TOKEN_SECRET;
    const expiresIn = process.env.ACCESS_TOKEN_EXPIRES_IN;

    const options = {
        expiresIn: expiresIn,
        algorithm: 'HS256',
    };

    return jwt.sign({ userId }, secret, options);
}

function signRefreshToken(userId, jti) {
    const secret = process.env.REFRESH_TOKEN_SECRET;
    const expiresIn = process.env.REFRESH_TOKEN_EXPIRES_IN;

    const options = {
        expiresIn: expiresIn,
        algorithm: 'HS256',
    };

    return jwt.sign({ userId, jti }, secret, options);
}

const createSendToken = (userId, jti, statusCode, res) => {
    const newAccessToken = signAccessToken(userId);
    const newResfreshToken = signRefreshToken(userId, jti);
    const isProduction = process.env.NODE_ENV === 'production';
    const domain = isProduction ? process.env.PERMIT_COOKIE_DOMAIN : undefined;
    res.cookie('accessToken', newAccessToken, {
        expires: new Date(Date.now() + Number(process.env.ACCESS_COOKIE_EXPIRES_IN) * 1000 * 60),
        httpOnly: true, // Ensures the cookie is only accessible via HTTP(S), not JavaScript
        // Change the setting for production based on your domain
        sameSite: isProduction ? 'none' : 'strict', // Change the production based on your domain
        secure: isProduction,
        domain,
    });

    res.cookie('refreshToken', newResfreshToken, {
        expires: new Date(
            Date.now() + Number(process.env.REFRESH_COOKIE_EXPIRES_IN) * 60 * 1000 * 60 * 24
        ),
        httpOnly: true,
        // Change the setting for production based on your domain
        sameSite: isProduction ? 'none' : 'strict',
        secure: isProduction,
        path: '/api/v1/auth/',
        domain,
    });

    //Remove password from output
    res.status(statusCode).json({
        status: 'success',
    });
};
// For login and signup page in case the user is logged in already.
export const isLoggedIn = catchAsync(async (req, res, next) => {
    if (!req.refreshPayload) {
        return next(new AppError('You are not logged in.', 401));
    }
    res.status(204).end();
});

export const tokenRefresh = catchAsync(async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    const payload = req.refreshPayload;
    try {
        const storedToken = await RefreshToken.findOneAndDelete({
            tokenId: payload.jti,
            user: payload.userId,
        }).session(session);
        if (!storedToken) {
            await session.abortTransaction();
            return next(new AppError('Invalid refresh token.', 401, TOKEN_ERRORS.INVALID_REFRESH));
        }
        const jti = uuidv4();
        await RefreshToken.create([{ user: payload.userId, tokenId: jti }], { session });
        await session.commitTransaction();
        createSendToken(payload.userId, jti, 200, res);
    } catch (err) {
        await session.abortTransaction();
        next(err);
    } finally {
        await session.endSession();
    }
});

export const userLogin = catchAsync(async (req, res, next) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return next(new AppError('Please provide email and password!', 400));
    }
    const user = await User.findOne({ email }).select('+password -friends -groups');
    if (!user || !(await user.correctPassword(password, user.password))) {
        return next(new AppError('Incorrect password or email', 401));
    }
    const jti = uuidv4();
    await RefreshToken.create({ user: user._id, tokenId: jti });
    createSendToken(user.id, jti, 200, res);
});

export const signup = catchAsync(async (req, res, next) => {
    if (req.body.displayName.length > 12) {
        return next(new AppError('Display Name can only be 12 characters or less', 400));
    }
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        // Even though we have escape characters on the client, we still need this for creating a new user since,
        // We use handlbars when we send an email to users during forgot password.
        // Unlike React, email clients do not auto-escape content.
        const currBody = sanitizeObject(req.body);
        const newUser = (await User.create([currBody], { session }))[0];
        const jti = uuidv4();
        await RefreshToken.create([{ user: newUser._id, tokenId: jti }], { session });
        await session.commitTransaction();
        createSendToken(newUser.id, jti, 201, res);
    } catch (err) {
        await session.abortTransaction();
        next(err);
    } finally {
        await session.endSession();
    }
});

// This logout request prioritizes the user’s request to terminate the session over the state of the tokens
// For smooth UX.
export const userLogout = catchAsync(async (req, res, next) => {
    if (req.cookies && req.cookies.refreshToken) {
        try {
            const refreshToken = req.cookies.refreshToken;
            const payload = await verifyToken(refreshToken, process.env.REFRESH_TOKEN_SECRET);
            // This checks if the token is manipulated or not, even if its manipulated,
            // its still considered a successful request since the user requests a logout
            // Which meant that we terminate the users current session.
            // Even if we don't have any stored token on the db, since the user requests a logout
            // it is still considered successful.
            if (
                !isRefreshPayload(payload) ||
                !(await RefreshToken.findOneAndDelete({
                    tokenId: payload.jti,
                    user: payload.userId,
                }))
            ) {
                removeTokens(res);
                return res.status(204).end();
            }
            removeTokens(res);
            res.status(204).end();
        } catch (err) {
            // Even though the refresh token in the cookies is invalid, its still considered
            // if we attempt to respond  with an error, there is no actual point since,
            // the user desires to terminate his/her session. Sending an error would just
            // ruin user experience.
            if (
                err instanceof Error &&
                (err.name === 'TokenExpiredError' || err.name === 'JsonWebTokenError')
            ) {
                removeTokens(res);
                return res.status(204).end();
            }
            next(err);
        }
    } else {
        if (req.cookies && req.cookies.accessToken) {
            res.clearCookie('accessToken', {
                httpOnly: true,
                sameSite: 'none',
                secure: true,
                domain:
                    process.env.NODE_ENV === 'production'
                        ? process.env.PERMIT_COOKIE_DOMAIN
                        : undefined,
            });
        }
        res.status(204).end();
    }
});

export const changePassword = catchAsync(async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const currentUser = await User.findById(req.user._id).select('+password').session(session);
        if (!(await currentUser.correctPassword(req.body.currentPassword, currentUser.password))) {
            await session.abortTransaction();
            return next(new AppError('Incorrect current password.', 401));
        }
        currentUser.password = req.body.password;
        const jti = uuidv4();
        // We still need .save since we need to run the pre save middleware to hash password
        await currentUser.save({ session });
        // Delete all refresh tokens during change password.
        await RefreshToken.deleteMany({ user: currentUser._id }).session(session);
        await RefreshToken.create([{ user: currentUser._id, tokenId: jti }], { session });
        await session.commitTransaction();
        createSendToken(currentUser.id, jti, 200, res);
    } catch (err) {
        await session.abortTransaction();
        next(err);
    } finally {
        await session.endSession();
    }
});

export const forgotPassword = catchAsync(async (req, res, next) => {
    // 1) Get user based on POSTed email
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
        return next(new AppError('There is no user with that email address.', 404));
    }
    // 2) Generate random reset
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });
    //Since we not only want to send message to the client(using AppError global error handler) when an error occurred during
    //sendEmail we also need to change the PasswordResetToken and passwordResetExpires to undefined
    //thats why we need try and catch
    try {
        const client =
            process.env.NODE_ENV === 'production'
                ? process.env.EMAIL_CLIENT_DOMAIN_PROD
                : process.env.EMAIL_CLIENT_DOMAIN_DEV;
        const resetURL = `${req.protocol}://${client}/resetPassword/${resetToken}`;
        await new Email(user, resetURL).sendPasswordReset();
        res.status(200).json({
            status: 'success',
            message: 'Token sent to email!',
        });
    } catch (err) {
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({ validateBeforeSave: false });
        errLogger.error('Authentication uncaught error', {
            message: err.message,
            stack: err.stack,
        });
        return next(new AppError('There was an error sending the email. Try again later!', 500));
    }
});

export const resetPassword = catchAsync(async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        // 1) get user based on the token
        const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
        const user = await User.findOne({
            passwordResetToken: hashedToken,
            passwordResetExpires: { $gt: Date.now() },
        }).session(session);
        // 2) If token has not expired, and there is a user, set the new password
        if (!user) {
            await session.abortTransaction();
            return next(new AppError('Token is invalid or has expired', 400));
        }

        user.password = req.body.password;
        // 3) Update changedpasswordAt property for the user
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({ session });
        const jti = uuidv4();
        await RefreshToken.deleteMany({ user: user._id }).session(session);
        await RefreshToken.create([{ user: user._id, tokenId: jti }], { session });
        await session.commitTransaction();
        // 4) Log the user in, send the JWT to client
        createSendToken(user.id, jti, 200, res);
    } catch (err) {
        await session.abortTransaction();
        next(err);
    } finally {
        await session.endSession();
    }
});

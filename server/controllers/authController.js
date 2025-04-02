import jwt from 'jsonwebtoken';
import { promisify } from 'util';
import User from '../models/userModel.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/appError.js';
import { Email } from '../utils/email.js';
import { errLogger } from '../utils/cloudwatchConfig.js';
import crypto from 'crypto'
import sanitizeObject from '../utils/sanitizeObj.js';

function signToken(id){
  return jwt.sign({ id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN
    });
};

const createSendToken = (userId, statusCode, req, res) => {
  const token = signToken(userId);
  res.cookie('jwt', token, {
    expires: new Date(
      Date.now() + Number(process.env.JWT_COOKIE_EXPIRES_IN) * 24 * 60 * 60 * 1000
    ),
    httpOnly: true, // Ensures the cookie is only accessible via HTTP(S), not JavaScript
    sameSite: 'none', //or Strict
    secure: true,
    domain: process.env.NODE_ENV === 'production'? process.env.PERMIT_COOKIE_DOMAIN : undefined
  })
  res.status(statusCode).json({
    status: 'success',
  });
};



export const verifyToken = promisify((token, secret, callback) => {
  // A callback function (err, decoded) which will be invoked by verify once it completes its operation.
  // the third parameter (err, decoded) is a callback that is called when verify finishes its work, 
  // When the original callback function is called callback(err, decoded as JwtPayload) by verify, promisify captures the 
  // err and decoded values and resolves or rejects the promise based on those values.
  const {verify} = jwt
  return verify(token, secret, (err, decoded) => {
    callback(err, decoded);
  });
});

// For login and signup page in case the user is logged in already.
export const isLoggedIn = catchAsync(async (req, res, next)=>{
  let token;
  if (req.cookies && req.cookies.jwt){
    token = req.cookies.jwt
  }
  if (!token) return res.status(401).json({isAuthenticated:false})
  const decoded = await verifyToken(token, process.env.JWT_SECRET)
  const currentUser = await User.findById(decoded.id)
  if(!currentUser){
    return next(new AppError('This user no longer exists.', 404))
  }
  if(currentUser.changedPasswordAfter(decoded.iat)){
    return next(new AppError('This user recently changed password! Please Log in again', 401))
  }
  res.status(200).json({
    isAuthenticated:true
  })
})  


export const login = catchAsync(async (req, res, next)=>{
    const {email, password} = req.body
    if (!email || !password) {
        return next(new AppError('Please provide email and password!', 400));
    }
    const user = await User.findOne({ email }).select('+password -friends -groups');
    if(!user||!(await user.correctPassword(password, user.password))){
        return next(new AppError('Incorrect password or email', 401))
    }
    createSendToken(user._id, 200, req, res)
})

export const signup = catchAsync(async (req, res, next)=>{
    if(req.body.displayName.length>12){
      return next(new AppError("Display Name can only be 12 characters or less", 400))
    }
    // Even though we have escape characters on the client, we still need this for creating a new user since,
    // We use handlbars when we send an email to users during forgot password.
    // Unlike React, email clients do not auto-escape content.
    const currBody = sanitizeObject(req.body)
    const newUser = await User.create(currBody)
    createSendToken(newUser._id, 201, req, res)
})

export const logout = catchAsync(async (req, res, _next)=>{
  res.clearCookie('jwt', {
    httpOnly: true, // Ensures the cookie is only accessible via HTTP(S), not JavaScript
    sameSite: 'none', //or Strict
    secure: true,
    domain: process.env.NODE_ENV === 'production'? process.env.PERMIT_COOKIE_DOMAIN : undefined
  });
  res.status(200).json({
    status:"success"
  });
})

export const protect = catchAsync(async (req, res, next)=>{
  let token;
  if (req.cookies && req.cookies.jwt){
    token = req.cookies.jwt
  }
  if(!token){
    return next(new AppError('You are not logged in! Pleace log in to get access', 401))
  }
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET)
  const currentUser = await User.findById(decoded.id)
  if(!currentUser){
    return next(new AppError('This user no longer exists.', 404))
  }
  if(currentUser.changedPasswordAfter(decoded.iat)){
    return next(new AppError('This user recently changed password! Please Log in again', 401))
  }
  //Save the current logged in user.
  req.user = currentUser
  next()
})

export const changePassword = catchAsync(async (req, res, next)=>{
  const currentUser = await User.findById(req.user._id).select('+password')
  if(!(await currentUser.correctPassword(req.body.currentPassword, currentUser.password))){
    return next(new AppError('Incorrect current password.', 401))
  }
  currentUser.password = req.body.password
  currentUser.passwordConfirm = req.body.passwordConfirm
  await currentUser.save()
  createSendToken(currentUser._id, 200, req, res)
})



export const forgotPassword = catchAsync(async (req,res,next)=>{
  // 1) Get user based on POSTed email
  const user = await User.findOne({email: req.body.email})
  if (!user){
      return next(new AppError('There is no user with that email address.', 404))
  }
  // 2) Generate random reset
  const resetToken = user.createPasswordResetToken();
  await user.save({validateBeforeSave: false}) 
  //Since we not only want to send message to the client(using AppError global error handler) when an error occurred during 
  //sendEmail we also need to change the PasswordResetToken and passwordResetExpires to undefined
  //thats why we need try and catch
  try{
      const client = process.env.NODE_ENV==='production'?process.env.CLIENT_DOMAIN_PROD:process.env.CLIENT_DOMAIN_DEV
      const resetURL = `${req.protocol}://${client}/resetPassword/${resetToken}`
      await new Email(user, resetURL).sendPasswordReset()
      res.status(200).json({
          status:'success',
          message: 'Token sent to email!'
      })
  }
  catch(err){
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({validateBeforeSave: false});
      errLogger.error('Authentication uncaught error', {message:err.message, stack:err.stack})
      return next(new AppError('There was an error sending the email. Try again later!', 500))
  }
})


export const resetPassword = catchAsync(async(req,res,next)=>{
  // 1) get user based on the token
  const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex')
  const user = await User.findOne({passwordResetToken: hashedToken, passwordResetExpires: {$gt: Date.now()}})
  // 2) If token has not expired, and there is a user, set the new password
  if (!user){
      return next(new AppError('Token is invalid or has expired', 400))
  }
  user.password = req.body.password
  // 3) Update changedpasswordAt property for the user
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  //we don't need validateBeforeSave: false since we need to check if the passwordConfirm is the same as the password.
  await user.save()
  // 4) Log the user in, send the JWT to client
  createSendToken(user._id, 200, req, res)
})
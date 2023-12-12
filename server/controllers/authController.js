const jwt = require('jsonwebtoken')
const {promisify} = require('util')
const User = require('../models/userModel')
const catchAsync = require('../utils/catchAsync')
const AppError = require('../utils/appError')

function signToken(id){
  return jwt.sign({ id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN
    });
  };

const createSendToken = (user, statusCode, res) => {
    const token = signToken(user._id);
    const cookieOptions = {
      expires: new Date(
        Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
      ),
      httpOnly: true
    };
    if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;
  
    res.cookie('jwt', token, cookieOptions);
  
    // Remove password from output
    user.password = undefined;
    res.status(statusCode).json({
      status: 'success',
      token,
      data: {
        user
      }
    });
  };

exports.login = catchAsync(async (req, res, next)=>{
    const {email, password} = req.body
    if (!email || !password) {
        return next(new AppError('Please provide email and password!', 400));
    }
    const user = await User.findOne({ email }).select('+password');
    if(!user){
      return next(new AppError("A user with that email does not exists.", 401))
    }
    if(!(await user.correctPassword(password, user.password))||!user){
        return next(new AppError('Incorrect password or email', 401))
    }
    createSendToken(user, 200, res)
})

exports.signup = catchAsync(async (req, res, next)=>{
    const newUser = await User.create(req.body)
    createSendToken(newUser, 201, res)
})

exports.protect = catchAsync(async (req, res, next)=>{
  let token;
  if(req.headers.authorization && req.headers.authorization.startsWith('Bearer')){
    token = req.headers.authorization.split(' ')[1]
  }
  if(!token){
    return next(new AppError('You are not logged in! Pleace log into get access', 401))
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

exports.changePassword = catchAsync(async (req, res, next)=>{
  const currentUser = await User.findById(req.user._id).select('+password')
  if(!(await currentUser.correctPassword(req.body.currentPassword, currentUser.password))){
    return next(new AppError('Incorrect current password.', 401))
  }
  currentUser.password = req.body.password
  currentUser.passwordConfirm = req.body.passwordConfirm
  await currentUser.save()
  createSendToken(currentUser, 200, res)
})
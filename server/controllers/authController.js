import jwt from 'jsonwebtoken';
import { promisify } from 'util';
import User from '../models/userModel.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/appError.js';

function signToken(id){
  return jwt.sign({ id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN
    });
  };

const createSendToken = (user, statusCode, req, res) => {
  const token = signToken(user._id);
  //Remove password from output
  user.password = undefined;
  res.status(statusCode).json({
    status: 'success',
    token
  });
};

export const login = catchAsync(async (req, res, next)=>{
    const {email, password} = req.body
    if (!email || !password) {
        return next(new AppError('Please provide email and password!', 400));
    }
    const user = await User.findOne({ email }).select('+password -friends -groups');
    if(!user||!(await user.correctPassword(password, user.password))){
        return next(new AppError('Incorrect password or email', 401))
    }
    createSendToken(user, 200, req, res)
})

export const signup = catchAsync(async (req, res, next)=>{
    const newUser = await User.create(req.body)
    if(req.body.displayName.length>12){
      return next(new AppError("Display Name can only be 12 characters or less"))
    }
    createSendToken(newUser, 201, req, res)
})

export const protect = catchAsync(async (req, res, next)=>{
  let token;
  if(req.headers.authorization && req.headers.authorization.startsWith('Bearer')){
    token = req.headers.authorization.split(' ')[1]
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
  createSendToken(currentUser, 200, req, res)
})
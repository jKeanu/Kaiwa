const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')

const userSchema = new mongoose.Schema({
    username:{
        type:String,
        require:[true, 'Must have a username'],
        unique: true,
    },
    email:{
        type:String,
        unique:true,
        required: [true, 'Please provide your email'],
        lowercase: true,
        validate: [validator.isEmail, 'Please provide a valid email']
    },
    photo:{
        type:String,
        default:'default.jpg'
    },
    password:{
        type:String,
        required:[true, 'Must have a password'],
        minlength:8,
        select:false
    },
    passwordConfirm:{
        type:String,
        require:true,
        validate:{
            validator:function(val){
                return val === this.password
            },
            message:'confirm password is incorrect'
        }
    },
    friends:[
        {
            type:mongoose.Schema.ObjectId,
            ref:'User'
        }
    ],
    channel:[
        {
            type:mongoose.Schema.ObjectId,
            ref:'Channel'
        }
    ],
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    active:{
        type:Boolean,
        default: true,
        select:false, //we want to hide this detail to the user
    }
})

const User = mongoose.model('Tour', userSchema)

module.exports = Tour;

  
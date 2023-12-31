const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')

const userSchema = new mongoose.Schema({
    displayName:{
        type:String,
        required:[true, 'Must have a display name'],
        maxlength:[10, 'Only maximum of 15 characters is allowed.'],
        minlength:[1, 'Please provide a display name']
    },
    friendTag:{
        type:String,
        required:[true, 'Friend Tag is required'],
        default: ()=>{
            const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
            let friendID = '';
            for (let i = 0; i < 6; i++) {
                friendID += characters.charAt(Math.floor(Math.random() * characters.length));
            }
            return friendID;
        },
        validate:{
            //This only works on create and save
            validator: function (value){
                return value.length === 6;
            },
            message: 'Friend Tag must be exactly 6 characters.'
        }
    },
    email:{
        type:String,
        unique:true,
        required: [true, 'Please provide your email'],
        lowercase: true,
        validate: [validator.isEmail, 'Please provide a valid email']
    },
    image:{
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
            validator: function(val){
                return val === this.password
            },
            message:'confirm password is incorrect'
        }
    },
    friends: [
        {
            friend: {
                type: mongoose.Schema.ObjectId,
                ref: 'User',
                index: true
            },
            channel: {
                type: mongoose.Schema.ObjectId,
                ref: 'Channel',
                required: [function() {
                    return this.status === 'Friend';
                }, 'A friend channel is required.']
            },
            status: {
                type: String,
                enum: ['Pending', 'Friend', 'Sent']
            }
        }
    ],
    groups:[{
            type: mongoose.Schema.ObjectId,
            ref: 'Channel'
        }],
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
})



//combination of friendTag and username has to be unique
userSchema.index({friendTag:1, displayName:1}, {unique:true})

// pre-save middleware is executed after the validation step
userSchema.pre('save', async function(next) {
    //by default creating a new document is considered motified
    if (!this.isModified('password')) return next();
    // Hash the password with cost of 12
    this.password = await bcrypt.hash(this.password, 12);
    // Delete passwordConfirm field
    this.passwordConfirm = undefined;
    next();
});

userSchema.pre('save', function(next){
    //if the file does not yet exists on the database, or its not modified, i.e you changed something that is not password,
    //it would meet this condition 
    if (!this.isModified('password')||this.isNew){
        return next()
    }
    //sometimes saving to the database is slower than issuing a token, so we need to minus it by 1sec (1000ms)
    this.passwordChangedAt = Date.now() - 1000;
    next()
})

userSchema.methods.correctPassword = async function(candidatePassword, userPassword) {
    return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function(TokenIssued){
    //this refers to the current document
    if(this.passwordChangedAt){
        //this expression is converting a JavaScript Date object into Unix timestamp
        //10 is the default val
        const changedTimestamp = parseInt(this.passwordChangedAt.getTime() /1000, 10)
        return TokenIssued < changedTimestamp
    }
    return false
}


const User = mongoose.model('User', userSchema)
module.exports = User;






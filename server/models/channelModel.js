const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')

const channelSchema = new mongoose.Schema({
    channelName:{
        type:String,
        required:[function(){
            return this.channelType === 'Group'
        }, 'Group Channel requires a channelName']
    },
    members:{
        type:[{
            type: mongoose.Schema.ObjectId,
            ref:'User'
        }],
        required:[true, "A channel must have at least 2 members"],
        validate: {
            validator: function(v) {
                return v.length >= 2;
            },
            message: props => `A channel must have at least 2 members, but only ${props.value.length} were provided.`
        }
    },
    channelType: {
        type:String,
        required:[true, 'A channel must have a type: Group or Friend'],
        enum:['Group', 'Friend']
    },
    messages:[{
        type:mongoose.Schema.ObjectId,
        ref:'Chat'
    }],
    channelNumber:{
        type:Number,
        require:[true, "A channel must have a channel number"],
        unique:true,
        default:() => Math.floor(Math.random() * 100)
    },
    image:{
        type:String,
        required:function(){
            return this.channelType==='Group'
        },
        default:function(){
            return this.channelType === 'Group'? 'default.jpg' : undefined
        }
    },
    lastMessage: Date
})

channelSchema.index({lastMessage:1})

channelSchema.pre('save', async function(next) {
    if (this.isNew) {
        const highestChannel = await this.constructor.findOne().sort('-channelNumber').exec();
        this.channelNumber = highestChannel ? highestChannel.channelNumber + this.channelNumber : this.channelNumber;
    }
    next();
});


const Channel = mongoose.model('Channel', channelSchema)
module.exports = Channel;

  
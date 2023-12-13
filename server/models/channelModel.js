const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')

const channelSchema = new mongoose.Schema({
    channelName:{
        type:String,
        required:[true, 'Channel must include a name']
    },
    members:{
        type:[{
            type: mongoose.Schema.ObjectId,
            ref:'User'
        }],
        required:[true, "A channel must have at least 2 members"]
    },
    messages:[{
        type:mongoose.Schema.ObjectId,
        ref:'Chat'
    }],
    lastMessage: Date
})

channelSchema.index({lastMessage:1})

const Channel = mongoose.model('Channel', channelSchema)
module.exports = Channel;

  
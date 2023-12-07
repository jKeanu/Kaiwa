const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')

const channelSchema = new mongoose.Schema({
    members:[{
        type: mongoose.Schema.ObjectId,
        ref:'User'
    }],
    chat:[{
        type:mongoose.Schema.ObjectId,
        ref:'Chat'
    }]
})

const Channel = mongoose.model('Tour', channelSchema)

module.exports = Channel;

  
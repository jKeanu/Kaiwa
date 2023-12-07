const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')


const chatSchema = new mongoose.Schema({
    sender:{
        type: mongoose.Schema.ObjectId,
        ref:'User'
    },
    content:{
        type:String,
        required:true
    },
    time:{
        type:Date,
        default:Date.now()
    }
})


const Chat = mongoose.model('Tour', chatSchemaSchema)

module.exports = Chat;

  
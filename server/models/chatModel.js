import mongoose from 'mongoose';

const chatSchema = new mongoose.Schema({
    sender:{
        type: mongoose.Schema.ObjectId,
        ref:'User'
    },
    channel:{
        type:mongoose.Schema.ObjectId,
        ref:'Channel'
    },
    content:{
        type:String,
        required:true
    },
    time:{
        type:Date,
        default:Date.now
    },
    formattedDate:String
})


chatSchema.index({time:-1})
const Chat = mongoose.model('Chat', chatSchema)

export default Chat;

  
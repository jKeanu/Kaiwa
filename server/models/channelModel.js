const mongoose = require('mongoose')

const channelSchema = new mongoose.Schema({
    channelName:{
        type:String,
        required:[function(){
            return this.channelType === 'Group'
        }, 'Group Channel requires a channelName']
    },
    groupLeader:{
        type:mongoose.Schema.ObjectId,
        ref:'User',
        required:[function(){
            return this.channelType === 'Group'
        }, 'Requires a group leader in the group channel.']
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
            message: "A channel must have at least 2 members"
        }
    },
    channelType: {
        type:String,
        required:[true, 'A channel must have a type: Group or Friend'],
        enum:['Group', 'Friend']
    },
    channelNumber:{
        type:Number,
        required:[true, "A channel must have a channel number"],
        unique:true,
        //since we don't want to cause a traffic in the future, everytime
        //a channel has been created, the channel number would be more than
        //the previous channel number.
        default:() => Math.floor(Math.random() * 100) + 1
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
},{
    //each time data is outputed as json we want virtuals to be part of the output
    toJSON: { virtuals: true},
    toObject: {virtuals: true}
})

channelSchema.index({lastMessage:1})

channelSchema.virtual('messages',{
    ref:'Chat',
    foreignField: 'channel',
    localField: '_id'
})

channelSchema.pre('save', async function(next) {
    if (this.isNew) {
        const highestChannel = await this.constructor.findOne().sort('-channelNumber').exec();
        this.channelNumber = highestChannel ? highestChannel.channelNumber + this.channelNumber : this.channelNumber;
    }
    next();
});


const Channel = mongoose.model('Channel', channelSchema)
module.exports = Channel;

  
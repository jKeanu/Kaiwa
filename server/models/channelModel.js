import mongoose from 'mongoose';

const channelSchema = new mongoose.Schema({
    channelName:{
        type:String,
        required:[function(){
            return this.channelType === 'Group'
        }, 'Group must have a name.'],
        maxlength:[12, 'A channel must contain no more than 10 characters'],
        minlength:[1, 'Please provide a name for your channel']
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
        required:[true, "A channel must have a member"],
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
        default:() => Math.floor(Math.random() * 10) + 1
    },
    photo:{
        type:String,
        required:function(){
            return this.channelType==='Group'
        },
        default:function(){
            return this.channelType === 'Group'? 'default.jpeg' : undefined
        }
    },
    lastMessage: {
        type:Date,
        default: Date.now
    },
    formattedLastMessage: {
        type: String,
        default: function(){
            const date = new Date(this.lastMessage)
            // Extracting parts of the date
            const day = date.getDate().toString().padStart(2, '0')
            const month = (date.getMonth() + 1).toString().padStart(2, '0') // getMonth() returns 0-11
            const year = date.getFullYear(); // Full year
            // Formatting the time
            let hours = date.getHours()
            const minutes = date.getMinutes().toString().padStart(2, '0')
            const ampm = hours >= 12 ? 'PM' : 'AM';
            hours = hours % 12
            hours = hours ? hours.toString().padStart(2, '0') : '12'; // the hour '0' should be '12'
            return `${month}/${day}/${year} ${hours}:${minutes} ${ampm}`
        }
    }
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
        //Since few channels there is a possibility that the channelNumber could collide during validation,
        //i.e if the channel number of the first channel was 9 and when creating the
        //second channel during the Math.floor(Math.random() * 10) + 1 you could still get 9, 
        //which will cause collision (unique). That's why we implemented the first value to 11
        //Since the expression above produces random integer between 1 and 10.
        this.channelNumber = highestChannel ? highestChannel.channelNumber + this.channelNumber : 11;
    }
    next();
});


const Channel = mongoose.model('Channel', channelSchema)

export default Channel
  
import { ActionType, Channel, ChannelAction } from "../types/channelTypes";

function sortChannels(channels:Channel[]):Channel[]{
    return channels.sort((a, b) => {
        const dateA = new Date(a.lastMessage).getTime() 
        const dateB = new Date(b.lastMessage).getTime() 
        return dateB - dateA; 
    })
}

function channelReducer(state:Channel[] | [], action:ChannelAction){
    switch (action.type){
        case ActionType.InitialFetch:
            return action.payload
        case ActionType.Seen: {
            const channels = [...state].map(channel => {
                if (channel._id === action.payload.channelId && !channel.seen.includes(action.payload.currUserId)) {
                    // Create a new object for the changed channel
                    const currChannel = {...channel}
                    currChannel.seen.push(action.payload.currUserId)
                    return currChannel
                }
                return channel; // Return the original channel object if no change is needed
            });
            return channels;
        }
        case ActionType.NewChannel:{
            const updateChannels = [...state]
            updateChannels.unshift(action.payload.data)
            return updateChannels
        }
        case ActionType.DeleteChannel:{
            const updateChannels = [...state]
            return updateChannels.filter(channel=>channel._id!==action.payload.channelId)
        }
        case ActionType.NewMessage:{
            const {channelNumber, channelId, seen, newTime, newFormattedTime} = action.payload.newMessageInfo
            const currChannels = [...state].map(channel=>{
                if(channel._id ===channelId){
                    const currChannel = {...channel}
                    if(action.payload.location === `/@me/channels/${channelNumber}`){
                        currChannel.seen.push(action.payload.currUserId.toString())
                    }else{
                        currChannel.seen = [...seen]
                    }
                    currChannel.lastMessage = newTime
                    if(newFormattedTime){
                        currChannel.formattedLastMessage = newFormattedTime
                    }
                    return {...currChannel}
                }
                return channel
            })
            return sortChannels(currChannels)
        }
        case ActionType.NewMember:{
            const updateChannels = [...state]
            const currChannel = updateChannels.find(channel=>channel.channelNumber===action.payload.channelNumber)
            if(currChannel){
                currChannel.lastMessage = action.payload.newTime
            }
            return sortChannels(updateChannels)
        }
        default:
            return state
    }   
}

export default channelReducer
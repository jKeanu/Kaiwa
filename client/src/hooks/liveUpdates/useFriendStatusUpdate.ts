import { Socket } from "socket.io-client"
import { UserStatusUpdate } from "../../types/userTypes"
import { ChannelDataStatus } from "../../types/channelTypes"
import { useSWRConfig } from "swr"
import { useEffect } from "react"
import { Friend } from "../../types/friendTypes"

const useFriendStatusUpdate = (socket:Socket|undefined, friendChannelIds:string[], 
    setFriendChannels:React.Dispatch<React.SetStateAction<Friend[]>>) =>{
    const {mutate} = useSWRConfig()

    //When a friend or a member of the group you're part of went online
    useEffect(()=>{
        if(socket){
            const handleUserOnlineStatus = (data:UserStatusUpdate):void=>{
                mutate(`api/v1/channels/${data.channelNumber}`, (channelDataCache:ChannelDataStatus|undefined)=>{
                    if(!channelDataCache){
                        return
                    }
                    const updateChannelDataCache = {...channelDataCache.channel}
                    const channelMembers = updateChannelDataCache.members
                    const channelMemberIndex = updateChannelDataCache.members.findIndex(member=>member._id===data.userId)
                    //update user status to online
                    channelMembers[channelMemberIndex] = {...channelMembers[channelMemberIndex], status:'Online'}
                    return {status:channelDataCache.status, channel:updateChannelDataCache}
                })
                //check if the user who went online is also your friend based on the friend channel id
                if(data.type==='Friend'){
                    const friendChannelId = friendChannelIds.find(friendChannelId => friendChannelId === data.channelId)
                    if(friendChannelId){
                        setFriendChannels(prevFriendChannels=>{
                            const updateFriendChannel = [...prevFriendChannels]
                            const friendIndex = updateFriendChannel
                                .findIndex(friendchannel=>friendchannel.channel._id===friendChannelId)
                            updateFriendChannel[friendIndex].friend.status = 'Online'
                            return updateFriendChannel
                        })
                    }
                }
            }
            socket.on('user_status_update_online', handleUserOnlineStatus)
            const cleanup =():void =>{
                socket.removeListener('user_status_update_online', handleUserOnlineStatus);
            }
            return cleanup
    }},[socket, friendChannelIds, mutate, setFriendChannels])
    
        //When a friend or a member of the group you're part of went offline
    useEffect(()=>{
        if(socket){
            const handleUserOfflineStatus = (data:UserStatusUpdate):void=>{
                mutate(`api/v1/channels/${data.channelNumber}`, (channelDataCache:ChannelDataStatus|undefined)=>{
                    if(!channelDataCache){
                        return undefined
                    }
                    const updateChannelDataCache = {...channelDataCache.channel}
                    const channelMembers = updateChannelDataCache.members
                    const channelMemberIndex = updateChannelDataCache.members.findIndex(member=>member._id===data.userId)
                    //update user status to offline
                    channelMembers[channelMemberIndex] = {...channelMembers[channelMemberIndex], status:'Offline'}
                    return {status:channelDataCache.status, channel:updateChannelDataCache}
                })
                if(data.type==='Friend'){
                    const friendChannelId = friendChannelIds.find(friendChannelId => friendChannelId === data.channelId)
                    if(friendChannelId){
                        setFriendChannels(prevFriendChannels=>{
                            const updateFriendChannel = [...prevFriendChannels]
                            const friendIndex = updateFriendChannel
                                .findIndex(friendchannel=>friendchannel.channel._id===friendChannelId)
                            updateFriendChannel[friendIndex].friend.status = 'Offline'
                            return updateFriendChannel
                        })
                    }
                }
            }
            socket.on('user_status_update_offline', handleUserOfflineStatus)
            const cleanup =():void =>{
                socket.removeListener('user_status_update_offline', handleUserOfflineStatus);
            }
            return cleanup
    }},[socket, friendChannelIds, mutate, setFriendChannels])
    
}

export default useFriendStatusUpdate
import { useEffect } from "react";
import { Socket } from "socket.io-client";
import { MemberUpdateInfo } from "../../types/groupTypes";
import { ActionType, ChannelAction, ChannelDataStatus, ChannelMemberUpdate } from "../../types/channelTypes";
import { useSWRConfig } from "swr";


const useChannelLiveUpdate = (socket:Socket|undefined, channelsDispatch:React.Dispatch<ChannelAction>)=>{
    const {mutate} = useSWRConfig()
    
    useEffect(()=>{
        if(socket){
            const handleChannelMemberInfoUpdate = (data:MemberUpdateInfo) =>{
                mutate(`api/v1/channels/${data.channelNumber}`, (ChannelCachedData: ChannelDataStatus | undefined)=>{
                    if(!ChannelCachedData){
                        return
                    }
                    const currentChannel = {...ChannelCachedData.channel}
                    const updateMembers = currentChannel.members.map(member=>{
                        if(member._id!==data.updatedUser._id){
                            return member
                        }else{
                            return  {...member, ...data.updatedUser}
                        }
                    })
                    currentChannel.members = updateMembers
                    return {status:ChannelCachedData.status, channel: currentChannel}
                })
            }
            socket.on("channel-member-update", handleChannelMemberInfoUpdate)
            return () =>{
                socket.removeListener("channel-member-update", handleChannelMemberInfoUpdate)
            }
        }
    }, [socket, mutate])

        //This updates when a member left or joined the channel that you are part of
        useEffect(()=>{
            if(socket){
                const handleChannelMemberUpdate = (data:ChannelMemberUpdate):void=>{
                    mutate(`api/v1/channels/${data.channelNumber}`, (channelDataCache:ChannelDataStatus|undefined)=>{
                        if(!channelDataCache){
                            return undefined
                        }
                        if(data.type==='Joined'){
                            //Update the channels when someone joined the channel
                            const updateChannelDataCache = {...channelDataCache.channel}
                            updateChannelDataCache.members = [...updateChannelDataCache.members, data.user]
                            return {status:channelDataCache.status, channel:updateChannelDataCache}
                        }else if(data.type==='Left'){
                            const updateChannelDataCache = {...channelDataCache.channel}
                            updateChannelDataCache.members = [...updateChannelDataCache.members].filter(member=>member._id!==data.user._id)
                            return {status:channelDataCache.status, channel:updateChannelDataCache}
                        }
                    })
                    if(data.type==='Joined'){
                        //update the channels when someone joined the channel
                        channelsDispatch({type:ActionType.NewMember, payload:{channelNumber:data.channelNumber, newTime:data.newTime}})
                    }
                }
                socket.on(`channel_member_update`, handleChannelMemberUpdate)
                const cleanup = ():void  =>{
                    socket.removeListener('channel_member_update', handleChannelMemberUpdate);
                }
                return cleanup
            }
        }, [socket, mutate, channelsDispatch])


}


export default useChannelLiveUpdate
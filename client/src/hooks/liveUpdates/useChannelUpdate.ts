import { useEffect } from "react";
import { Socket } from "socket.io-client";
import { MemberUpdateInfo } from "../../types/groupTypes";
import { ActionType, ChannelAction, ChannelMemberUpdate, CurrentChannel } from "../../types/channelTypes";
import { useSWRConfig } from "swr";


const useChannelLiveUpdate = (socket:Socket|undefined, channelsDispatch:React.Dispatch<ChannelAction>)=>{
    const {mutate} = useSWRConfig()
    
    // When someone changed their profile or information (Display name or friend tag)
    useEffect(()=>{
        if(socket){
            const handleChannelMemberInfoUpdate = (data:MemberUpdateInfo) =>{
                mutate(`api/v1/channels/${data.channelNumber}`, (channelCachedData: CurrentChannel|undefined)=>{
                    if(!channelCachedData){
                        return
                    }
                    const currentChannel = {...channelCachedData}
                    const updateMembers = currentChannel.members.map(member=>{
                        if(member._id!==data.updatedUser._id){
                            return member
                        }else{
                            return  {...member, ...data.updatedUser}
                        }
                    })
                    currentChannel.members = updateMembers
                    return currentChannel
                }, false)
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
                mutate(`api/v1/channels/${data.channelNumber}`, (channelDataCache:CurrentChannel|undefined)=>{
                    if(!channelDataCache){
                        return undefined
                    }
                    if(data.type==='Joined'){
                        //Update the channels when someone joined the channel
                        const updateChannelDataCache = {...channelDataCache}
                        updateChannelDataCache.members = [...updateChannelDataCache.members, data.user]
                        return updateChannelDataCache
                    }else if(data.type==='Left'){
                        const updateChannelDataCache = {...channelDataCache}
                        updateChannelDataCache.members = [...updateChannelDataCache.members].filter(member=>member._id!==data.user._id)
                        return updateChannelDataCache
                    }
                }, false)
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
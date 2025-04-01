import { useEffect } from "react"
import { Socket } from "socket.io-client"
import { ActionType, Channel, ChannelAction, CurrentChannel } from "../../types/channelTypes"
import { useLocation, useNavigate } from "react-router-dom"
import { NoticeModalSettings } from "../../types/modalTypes"
import { useSWRConfig } from "swr"


const useGroupUpdate = (socket:Socket|undefined, channelsDispatch: (value: ChannelAction) => void,
    setNoticeModal: React.Dispatch<React.SetStateAction<NoticeModalSettings>>) =>{
    const navigate = useNavigate()
    const location = useLocation()
    const {mutate} = useSWRConfig()

    //This executed when a you were invited to an already existing group channel
    useEffect(()=>{
        if(socket){
            const groupChannelInvite = (newGroupChannel:Channel)=>{
                channelsDispatch({type:ActionType.NewChannel, payload:{data:newGroupChannel}})
            }
            socket.on('invited_to_group', groupChannelInvite)
            const cleanup = ():void=>{
                socket.removeListener('invited_to_group', groupChannelInvite)
            }
            return cleanup
        }
    }, [socket, channelsDispatch])

    //When someone in your friends included you in a new group
    useEffect(()=>{
        if(socket){
            const handleNewGroupChannel = (data:Channel)=>{
                channelsDispatch({type:ActionType.NewChannel, payload:{data:data}})
            }
            socket.on('new_group_channel', handleNewGroupChannel)
            const cleanup=():void=>{
                socket.removeListener('new_group_channel', handleNewGroupChannel)
            }
            return cleanup
        }
    }, [socket, channelsDispatch])

    //This executes when the group leader of a group channel deleted the group channel
    useEffect(()=>{
        if(socket){
            const handleGroupDeletion = (data:{channelNumber:number, channelId:string}):void=>{
                if(location.pathname === `/@me/channels/${data.channelNumber}`){
                    navigate('/@me')
                    setNoticeModal({isOpen:true, channelId:data.channelId, type:'Group'})
                }else{
                    channelsDispatch({type:ActionType.DeleteChannel, payload:{channelId:data.channelId}})
                }
            }
            socket.on("delete_group_channel", handleGroupDeletion)
            const cleanup=():void=>{
                socket.removeListener('delete_group_channel', handleGroupDeletion)
            }
            return cleanup
        }
    }, [socket, location, navigate, channelsDispatch, setNoticeModal])


    //When someone assigned you as a new leader of a group channel
    useEffect(()=>{
        if(socket){
            const handleNewLeader = (data:{channelNumber:number, newLeaderId:string}):void=>{
                mutate(`api/v1/channels/${data.channelNumber}`, (cachedChannelData:CurrentChannel|undefined)=>{
                    if(!cachedChannelData){
                        return
                    }
                    const updateChannelData = {...cachedChannelData}
                    updateChannelData.groupLeader = data.newLeaderId
                    return updateChannelData
                }, false)
            }

            socket.on("new_group_leader", handleNewLeader)
            return () =>{
                socket.removeListener("new_group_leader", handleNewLeader)
            }
        }
    }, [socket, mutate])

}

export default useGroupUpdate
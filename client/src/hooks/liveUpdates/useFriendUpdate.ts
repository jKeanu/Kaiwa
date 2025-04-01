import { useEffect } from "react"
import { Socket } from "socket.io-client"
import { Friend, FriendReq, FriendRequestAccepted, SentReq } from "../../types/friendTypes"
import { useLocation, useNavigate } from "react-router-dom"
import { ActionType, ChannelAction } from "../../types/channelTypes"
import { NoticeModalSettings } from "../../types/modalTypes"




const useFriendUpdate = (
    socket:Socket|undefined, 
    sentReqs:SentReq[], 
    setSentReqs:React.Dispatch<React.SetStateAction<SentReq[]>>,
    handleNewFriendChannel: (friendInfo: Friend) => void,
    setFriendReqs: React.Dispatch<React.SetStateAction<FriendReq[]>>,
    channelsDispatch: React.Dispatch<ChannelAction>,
    setFriendChannels: React.Dispatch<React.SetStateAction<Friend[]>>,
    setNoticeModal: React.Dispatch<React.SetStateAction<NoticeModalSettings>>

)=>{
    const navigate = useNavigate()
    const location = useLocation()

    // When someone added you as a friend
    useEffect(()=>{
        if(socket){
            const handleFriendRequest = (data:FriendReq)=>{
                setFriendReqs(prevUserReqs=> [...prevUserReqs, data])
            }
            socket.on('receive-friend-request', handleFriendRequest)
            const cleanup = ():void=>{
                socket.removeListener('receive-friend-request', handleFriendRequest)
            }
            return cleanup
        }
    }, [socket, setFriendReqs])
    
    // New Friend channel when someone accepted your friend request.
    useEffect(()=>{
        if(socket){
            const handleRequestAccepted = (data:FriendRequestAccepted)=>{
                const newFriendInfo = [...sentReqs].find(sentReq=>sentReq.friend._id===data.newFriendId)
                if(newFriendInfo){
                    const newFriendChannel:Friend = {
                        channel:{...data.newChannelInfo},
                        friend:{
                            ...newFriendInfo.friend
                        },
                        _id:newFriendInfo._id,
                        status:"Friend"
                    }
                    handleNewFriendChannel(newFriendChannel)
                    setSentReqs(prevSentReqs=>{
                        return [...prevSentReqs].filter(sentReqs=>sentReqs.friend._id!==data.newFriendId)
                    })
                }}
            socket.on('friend_request_accepted', handleRequestAccepted)
            const cleanup = ():void=>{
                socket.removeListener('friend_request_accepted', handleRequestAccepted)
            }
            return cleanup
        }
    }, [socket, sentReqs, handleNewFriendChannel, setSentReqs])

    //When someone declined your friend request
    useEffect(()=>{
        if(socket){
            const handleRequestDeclined = (data:{userId:string}):void=>{
                setSentReqs(prevSentReqs=>[...prevSentReqs].filter(sentReq=>sentReq.friend._id!==data.userId))
            }
            socket.on("friend_request_declined", handleRequestDeclined)
            const cleanup = ():void=>{
                socket.removeListener('friend_request_declined', handleRequestDeclined)
            }
            return cleanup
        }
    }, [sentReqs, socket, setSentReqs])

    //This executes when you have been unfriended by one of your friends
    useEffect(()=>{
        if(socket){
            const handleFriendDeletion = (data:{channelNumber:number, channelId:string}):void=>{
                if(location.pathname === `/@me/channels/${data.channelNumber}`){
                    navigate('/@me')
                    setNoticeModal({isOpen:true, channelId:data.channelId, type:'Friend'})
                }else{
                    channelsDispatch({type:ActionType.DeleteChannel, payload:{channelId:data.channelId}})
                    setFriendChannels(prevFriendChannels=> [...prevFriendChannels]
                        .filter(channel=>channel.channel._id!==data.channelId))
                }
            }
            socket.on("delete_friend_channel", handleFriendDeletion)
            const cleanup=():void=>{
                socket.removeListener('delete_friend_channel', handleFriendDeletion)
            }
            return cleanup
        }
    }, [socket, location, navigate, channelsDispatch, setFriendChannels, setNoticeModal])

}

export default useFriendUpdate
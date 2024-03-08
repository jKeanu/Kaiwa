import { useState } from "react"
import { useMemo } from "react"
import { FriendReqProps, AcceptFriendStatus, Friend } from "../../types/generalTypes"
import { AxiosResponse } from "axios"
import { acceptFriend, declineFriend } from "../../services/apiService"


const FriendReq:React.FC<FriendReqProps>=({pendingRequests, token, handleNewFriendChannel, setFriendReqs, socket,
     currUserId, currComponent})=>{
    const [loading, setLoading] = useState([''])
    const [error, setError] = useState([''])

    //friendId is the object that contains the user info and your status with that user
    const handleAcceptRequest = async (e:React.MouseEvent<HTMLButtonElement>, pendingUserId:string, friendId:string):Promise<void>=>{
        e.preventDefault()
        setLoading(prevLoading=>[...prevLoading, `req-${pendingUserId}`])
        setError(prevError=>{
            const updateError = [...prevError]
            return updateError.filter(error=>error!==`error-${pendingUserId}`)
        })  
        try{
            const res:AxiosResponse<AcceptFriendStatus> = await acceptFriend(token, pendingUserId)
            if(res.data.status==='success'){
                const fetchedNewChannelData = {...res.data.newChannel}
                //we sort it this way to make the pending user always on the index 0
                const sortMembers = fetchedNewChannelData.members.sort((a,b)=>{
                    return (a._id === pendingUserId && b._id !== pendingUserId)?-1:1
                })
                //We need it in this format so we can update the friendChannels
                const newChannel:Friend = {
                    channel:{
                        channelType:fetchedNewChannelData.channelType,
                        channelNumber:fetchedNewChannelData.channelNumber,
                        lastMessage:fetchedNewChannelData.lastMessage,
                        _id:fetchedNewChannelData._id,
                        id: fetchedNewChannelData.id
                    },
                    friend:{
                        ...sortMembers[0]
                    },
                    status:"Friend",
                    _id:friendId
                }
                handleNewFriendChannel(newChannel)
                setFriendReqs(prevUserReqs=>{
                    const updateUserReqs = [...prevUserReqs]
                    return updateUserReqs.filter(userReqs=>userReqs.friend._id!==pendingUserId)
                })
                if(socket){
                    socket.emit('accepted_pending_friend_request', {
                        newChannelInfo: newChannel.channel,
                        pendingUserId: pendingUserId,
                        newFriendId: currUserId
                    })
                }
            }
        }catch(err : unknown){  
            setLoading(prevLoading=>{
                const updateLoading = [...prevLoading]
                return updateLoading.filter(loading => loading!==`req-${pendingUserId}`)
            })
            setError(prevError=>[...prevError, `error-${pendingUserId}`])  
        }
    }

    const handleRejectRequest = async (e:React.MouseEvent<HTMLButtonElement>, pendingUserId:string):Promise<void>=>{
        e.preventDefault()
        setLoading(prevLoading=>[...prevLoading, `req-${pendingUserId}`])
        setError(prevError=>{
            const updateError = [...prevError]
            return updateError.filter(error=>error!==`error-${pendingUserId}`)
        })  
        try{
            const res:AxiosResponse<void>= await declineFriend(token, pendingUserId)
            if(res.status===204){
                setFriendReqs(prevUserReqs=>{
                    const updateUserReqs = [...prevUserReqs]
                    return updateUserReqs.filter(userReqs=>userReqs.friend._id!==pendingUserId)
                })
                if(socket){
                    socket.emit("declined_pending_friend_request", {declinedUser: pendingUserId, userId:currUserId})
                }
            }
        }catch(err){
            setLoading(prevLoading=>{
                const updateLoading = [...prevLoading]
                return updateLoading.filter(loading => loading!==`req-${pendingUserId}`)
            })
            setError(prevError=>[...prevError, `error-${pendingUserId}`])  
        }}

    return(
        <section className={`pending-request-section ${currComponent==='friendReq'&&'pending-request-section-active'}`}>
            <ul className="pending-request">
                {pendingRequests.map((request, index)=>(
                    <li className="pending-user-container" key={index}>
                        <div className="pending-user-information" >
                            <img src={`/img/${request.friend.photo}`}/>
                            <span>{request.friend.displayName}</span>
                        </div>
                        <div className="pending-request-button-container">
                            {loading.includes(`req-${request.friend._id}`)?
                            <div className="friend-req-button-loading"></div>
                            :
                            <>
                                {error.includes(`error-${request.friend._id}`)&&
                                <span className="pending-request-error">An error occurred</span>}
                                <button className="accept-friend-request-button" 
                                onClick={(e)=>handleAcceptRequest(e, request.friend._id, request._id)}>
                                    <img src="/img/accept.svg" />
                                </button>
                                <button className="decline-friend-request-button" 
                                onClick={(e)=>handleRejectRequest(e, request.friend._id)}>
                                    <img src="/img/decline.svg"/>
                                </button>
                            </>
                            }
                        </div>
                    </li>
                ))}
            </ul>
        </section>
    )
}


export default FriendReq
import { useState } from "react"
import { useMemo } from "react"
import { FriendReqProps, AcceptFriendStatus, Friend } from "../../types/generalTypes"
import { AxiosResponse } from "axios"
import { acceptFriend } from "../../services/apiService"


const FriendReq:React.FC<FriendReqProps>=({pendingRequests, token, handleNewFriendChannel, setUserReqs})=>{
    const [loading, setLoading] = useState('')

    const handleAcceptRequest = async (e:React.MouseEvent<HTMLButtonElement>, pendingUserId:string):Promise<void>=>{
        e.preventDefault()
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
                    _id:fetchedNewChannelData._id
                }
                handleNewFriendChannel(newChannel)
            }
        }catch(err : unknown){  
            console.log('ACCEPT ERROR', err)  
        }
    }

    return(
        <section className="pending-request-section">
            <ul className="pending-request">
                {pendingRequests.map((request, index)=>(
                    <li className="pending-user-container" key={index}>
                        <div className="pending-user-information" >
                            <img src={`/img/${request.friend.photo}`}/>
                            <span>{request.friend.displayName}</span>
                        </div>
                        <div className="pending-request-button-container">
                            <button className="accept-friend-request-button" onClick={(e)=>handleAcceptRequest(e, request.friend._id)}>
                                <img src="/img/accept.svg" />
                            </button>
                            <button className="decline-friend-request-button">
                                <img src="/img/decline.svg"/>
                            </button>
                        </div>
                    </li>
                ))}
            </ul>
        </section>
    )
}


export default FriendReq
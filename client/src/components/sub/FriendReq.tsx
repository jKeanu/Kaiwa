import { useState } from "react"
import { useMemo } from "react"
import { Channel, FriendReqProps, acceptFriendStatus } from "../../types/generalTypes"
import { AxiosResponse } from "axios"
import { acceptFriend } from "../../services/apiService"


const FriendReq:React.FC<FriendReqProps>=({pendingRequests, token})=>{
    //the statusId is the _id that represents the object that consists of the status of the relationship, the channel and the friend Info
    const handleAcceptRequest = async (e:React.MouseEvent<HTMLButtonElement>, pendingUserId:string, photo:string, name:string, statusId:string):Promise<void>=>{
        e.preventDefault()
        try{
            const res:AxiosResponse<acceptFriendStatus> = await acceptFriend(token, pendingUserId)
            if(res.data.status==='success'){
                const fetchedNewChannel = {...res.data.newChannel}
                const newChannel:Channel = {
                    channelName: name,
                    channelType: fetchedNewChannel.channelType,
                    channelNumber: fetchedNewChannel.channelnumber,
                    lastMessage: fetchedNewChannel.lastMessage,
                    photo,
                    _id:fetchedNewChannel._id,
                    id: fetchedNewChannel.id
                }
            }
        }catch(err : unknown){  
            console.log('1')  
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
                            <button className="accept-friend-request-button" onClick={(e)=>handleAcceptRequest(e, request.friend._id, request.friend.photo, request.friend.displayName, request._id)}>
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
import { useState } from "react"
import { useMemo } from "react"
import { FriendReqProps } from "../../types/generalTypes"
import { AxiosResponse } from "axios"


const FriendReq:React.FC<FriendReqProps>=({pendingRequests, token})=>{
    

    const handleAcceptRequest = async (e:React.MouseEvent<HTMLButtonElement>):Promise<void>=>{
        e.preventDefault()
        try{
            console.log(1)
        }catch(err : unknown){  
            console.log('1')  
        }
    }

    return(
        <section className="pending-request-section">
            <div className="pending-request-container">
                <ul className="pending-request">
                    {pendingRequests.map((request, index)=>(
                        <li className="pending-user-container" key={index}>
                            <div className="pending-user-information">
                                <img src={`/img/${request.friend.photo}`}/>
                                <span>{request.friend.displayName}</span>
                            </div>
                            <div className="pending-request-button-container">
                                <button className="accept-friend-request-button">
                                    <img src="/img/accept.svg" />
                                </button>
                                <button className="decline-friend-request-button">
                                    <img src="/img/decline.svg"/>
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </section>
    )
}


export default FriendReq
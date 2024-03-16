import React, { useMemo, useState } from "react"
import { HomeSectionProps } from "../types/generalTypes"
import FriendList from "./sub/FriendList"
import FriendReq from "./sub/FriendReq"
import AddFriend from "./sub/AddFriend"

const HomeSection:React.FC<HomeSectionProps>=({friendChannels, friendReqs, isFriendsOpen})=>{
    const [isFriendConnection, setIsFriendConnection] = useState(false)
    const [currComponent, setCurrComponent] = useState<string>('addFriend')

    const sortedFriends = useMemo(()=>{
        return [...friendChannels].sort((a, b) => {
            return a.friend.status === "Online" && b.friend.status !== "Online" ? -1 : 1;
        })
    }, [friendChannels])

    const closeFriendConnection = (e:React.MouseEvent<HTMLButtonElement>):void=>{
        e.preventDefault()
        setIsFriendConnection(false)
    }

    return(
        <section className={`home-section-container ${isFriendsOpen?'home-section-container-mob':''}`}>
            <section className="friend-section">
                <FriendList friends={sortedFriends} setIsFriendConnection={setIsFriendConnection} />
                <div className={`friend-connection-container ${isFriendConnection?'friend-connection-container-active':''}`}>
                    <button onClick={closeFriendConnection} className="connections-to-friendlist-button">
                        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#b9b9b9 " 
                            strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="feather feather-arrow-left">
                                <line x1="19" y1="12" x2="5" y2="12"></line>
                                <polyline points="12 19 5 12 12 5"></polyline>
                        </svg>
                    </button>
                    <div className="connections-button-container">
                        <button className="add-friend-button" onClick={()=>setCurrComponent('addFriend')}
                        style={{borderBottom:`${currComponent==='addFriend'?'1px solid grey':''}`}}>
                            Add Friend
                        </button>
                        <button className="friend-request-button" onClick={()=>setCurrComponent('friendReq')} 
                        style={{borderBottom:`${currComponent==='friendReq'?'1px solid grey':''}`}}>
                            Friend Requests
                            {friendReqs.length>0&&
                            <div className="request-indicator">
                            </div>}
                        </button>
                    </div>
                    <div className="friend-req-add-container">
                        <FriendReq pendingRequests={friendReqs} currComponent={currComponent}/>
                        <AddFriend currComponent={currComponent}/>
                    </div>
                    {currComponent==='friendReq'&&
                    <FriendReq pendingRequests={friendReqs} currComponent={currComponent}/>}
                    {currComponent==='addFriend'&&
                    <AddFriend currComponent={currComponent}/>}
                </div>
            </section>
        </section>
    )
}

export default HomeSection
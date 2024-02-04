import { useEffect, useMemo, useState } from "react"
import { HomeSectionProps } from "../types/generalTypes"
import FriendList from "./sub/FriendList"
import FriendReq from "./sub/FriendReq"
import AddFriend from "./sub/AddFriend"

const HomeSection:React.FC<HomeSectionProps>=({friendChannels, token, currUserId, socket, userReqs, setFriendChannels, setUserReqs})=>{
    const [currComponent, setCurrComponent] = useState<string>('addFriend')

    const friendReqs = useMemo(()=>{
        return [...userReqs].filter(user=>user.status==='Pending')
    }, [userReqs])

    const sentReqs = useMemo(()=>{
        return [...userReqs].filter(user=>user.status==='Sent')
    }, [userReqs])

    const sortedFriends = useMemo(()=>{
        return [...friendChannels].sort((a, b) => {
            return a.friend.status === "Online" && b.friend.status !== "Online" ? -1 : 1;
        })
    }, [friendChannels])

    return(
        <section className="home-section-container">
            <section className="friend-section">
                <FriendList friends={sortedFriends} token={token}/>
                <div className="friend-connection-container">
                    <div className="home-button-container">
                        <button className="add-friend-button" onClick={()=>setCurrComponent('addFriend')}>
                            Add Friend
                        </button>
                        <button className="friend-request-button" onClick={()=>setCurrComponent('friendReq')}>
                            Friend Requests
                            {friendReqs.length>0&&
                            <div className="request-indicator">
                            </div>}
                        </button>
                    </div>
                    {currComponent==='friendReq'&&
                    <FriendReq token={token} pendingRequests={friendReqs}
                     setFriendChannels={setFriendChannels} setUserReqs={setUserReqs}/>}
                    {currComponent==='addFriend'&&
                    <AddFriend token={token}/>}
                </div>
            </section>
        </section>
    )
}

export default HomeSection
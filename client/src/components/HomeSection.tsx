import { useMemo, useState } from "react"
import { HomeSectionProps } from "../types/generalTypes"
import FriendList from "./sub/FriendList"

const HomeSection:React.FC<HomeSectionProps>=({friends, token, currUserId, socket})=>{

    const friendReqs = useMemo(()=>{
        return [...friends].filter(friend=>friend.status==='Pending')
    }, [friends])

    const sentReqs = useMemo(()=>{
        return [...friends].filter(friend=>friend.status==='Sent')
    }, [friends])

    const sortedFriends = useMemo(()=>{
        return [...friends].sort((a, b) => {
            return a.friend.status === "Online" && b.friend.status !== "Online" ? -1 : 1;
        })
    }, [friends])

    return(
        <section className="home-section-container">
            <h1 className="friends-header">Friends</h1>
            <section className="friend-section">
                <FriendList friends={sortedFriends}/>
        
            </section>
        </section>
    )
}

export default HomeSection
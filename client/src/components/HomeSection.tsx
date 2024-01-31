import { useMemo } from "react"
import { HomeSectionProps } from "../types/generalTypes"
import FriendList from "./sub/FriendList"

const HomeSection:React.FC<HomeSectionProps>=({friends, token, currUserId, socket})=>{
    const friendReqs = useMemo(()=>{
        return [...friends].filter(friend=>friend.status==='Pending')
    }, [friends])

    const sentReqs = useMemo(()=>{
        return [...friends].filter(friend=>friend.status==='Sent')
    }, [friends])

    return(
        <section className="home-section-container">
            <div className="home-button-container">
                <button className="friends-home-button">
                    Friends
                </button>
            </div>
            <section className="friend-section">
                <FriendList friends={friends}/>
            
            </section>
        </section>
    )
}

export default HomeSection
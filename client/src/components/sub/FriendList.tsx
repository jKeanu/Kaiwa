import { FriendListProps } from "../../types/generalTypes";
import { Link } from "react-router-dom";
import { useState, useMemo } from "react";

const FriendList:React.FC<FriendListProps>=({friends, token})=>{
    const [searchQuery, setSearchQuery] = useState<string>('')
    const filteredFriends = useMemo(()=>{
        return [...friends].filter(friend=>friend.friend.displayName.toLowerCase().includes(searchQuery.toLowerCase()))
    }, [searchQuery, friends])

    return(
        <div className="friend-list-container">
            <div className="friend-list-top-section">
                <h2 className="friends-header">Friends</h2>
                <input className="friend-list-search-input" placeholder="Search friend"
                onChange={(e)=>setSearchQuery(e.target.value)} value={searchQuery}/>
            </div>
            <ul className="friend-list">
                {filteredFriends.map(friend=>(
                    <li key={friend.channel.channelNumber} className="friend-link-container">
                        <Link className='friend-link' to={`channels/${friend.channel.channelNumber}`}>
                            <div className="friend-information">
                                <div className="friend-photo-status-container">
                                    <img className='friend-photo' src={`/img/${friend.friend.photo}`}/>
                                    <div className='friend-status'
                                     style={{backgroundColor:friend.friend.status==='Online'?'green':'#959595'}}></div>
                                </div>
                                <div className="user-displayName-status-container">
                                    <span className='friend-displayName'>{friend.friend.displayName}</span>
                                    {friend.friend.status==='Online'?
                                    <span className="friend-status">Online</span>
                                    :
                                    <span className="friend-status">Offline</span>}
                                </div>
                            </div>
                            <button className="friend-more-button">
                                <img src="/img/friend-more.svg"/>
                            </button>
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    )
}

export default FriendList
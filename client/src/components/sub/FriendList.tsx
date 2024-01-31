import { FriendListProps } from "../../types/generalTypes";
import { Link } from "react-router-dom";

const FriendList:React.FC<FriendListProps>=({friends})=>{
    return(
        <div className="friend-list-container">
            <ul className="friend-list">
                {friends.map(friend=>(
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
                            <button className="unfriend-friend-button">
                                <img src="/img/unfriend.svg"/>
                            </button>
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    )
}

export default FriendList
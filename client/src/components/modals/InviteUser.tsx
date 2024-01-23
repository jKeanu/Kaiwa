import {FriendDetails, InviteFriend} from "../../types/generalTypes"
import { inviteFriendtoGroup } from "../../services/apiService"
import { AxiosResponse } from "axios"


const InviteUserModal:React.FC<InviteFriend>=({friends, channelId, token})=>{
    const handleInvite = async (e:React.MouseEvent<HTMLButtonElement>, token:string, channelId:string, friend:FriendDetails):Promise<void> => {
        e.preventDefault()
        try{
            const res:AxiosResponse<{status:string}> = await inviteFriendtoGroup(token, channelId, friend._id)
            if(res.data.status === 'success'){
            }
        }
        catch(err){
            console.log(err)
        }
    }
    return(
        <div className="invite-modal-container">
            <h2 className="modal-header">Invite a Friend</h2>
            <div className="modal-text">Invite a user from your friend list.</div>
            <div className="invite-modal-friend-list">
                <ul className="invite-friend-list-containter">
                    {friends.map((friend)=>(
                        <li className="invite-friend-info">
                            <img src={`/img/${friend.photo}`}/>
                            <div className="friend-invite-display-name">{friend.displayName}</div>
                            <button onClick={(e)=>handleInvite(e, token, channelId, friend)} className="friend-invite-button">
                                Invite
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    )
}   

export default InviteUserModal
import {FriendDetails, InviteFriend} from "../../types/generalTypes"
import { inviteFriendtoGroup } from "../../services/apiService"
import { AxiosResponse } from "axios"


export const InviteUserModal:React.FC<InviteFriend>=({friends, channelId, setChannelMembers, token})=>{
    const handleInvite = async (e:React.MouseEvent<HTMLButtonElement>, token:string, channelId:string, friend:FriendDetails):Promise<void> => {
        e.preventDefault()
        try{
            const res:AxiosResponse<{status:string}> = await inviteFriendtoGroup(token, channelId, friend._id)
            if(res.data.status === 'success'){
                setChannelMembers(prevMembers => [...prevMembers, friend])
            }
        }
        catch(err){
            console.log(err)
        }
    }
    return(
        <div className="invite-modal-container">
            <div className="invite-modal-friend-list">
                <ul className="invite-friend-list-containter">
                    {friends.map((friend)=>(
                        <li className="invite-friend-info">
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
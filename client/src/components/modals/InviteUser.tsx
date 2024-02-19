import { FriendDetails, InviteFriend } from "../../types/generalTypes"
import { inviteFriendtoGroup } from "../../services/apiService"
import { AxiosResponse } from "axios"
import { useEffect } from "react"
import { useState} from "react"

const InviteUserModal:React.FC<InviteFriend>=({friends, channelId, token, currChannelMembersId, socket, channelNumber, handleCloseButton})=>{
    const [modalVisible, setModalVisible] = useState(false)
    const [loadings, setLoadings] = useState<string[]>([])
    const [error, setError] = useState<{isError:boolean, users:string[]}>({isError:false, users:[]})

    useEffect(()=>{
        setModalVisible(true)
    },[])

    const isFriendInGroup:FriendDetails[] = friends.filter(friend => !currChannelMembersId.includes(friend._id))
    const handleInvite = async (e:React.MouseEvent<HTMLButtonElement>, friend:FriendDetails):Promise<void> => {
        e.preventDefault()
        setLoadings(prevLoadings=>[...prevLoadings, `${friend._id}`])
        setError(prevError=>{
            return {isError:false, users:[...prevError.users].filter(user=>user!==`${friend._id}`)}
        })
        try{
            const res:AxiosResponse<{status:string}> = await inviteFriendtoGroup(token, channelId, friend._id)
            if(res.data.status === 'success'){
                if(socket && channelId && channelNumber){
                    socket.emit('user_invite_success', {inviteUser:friend._id, channelId, channelNumber})
                }
            }
        }
        catch(err){
            setError(prevError=>{
                return {isError:true, users:[...prevError.users, `${friend._id}`]}
            })
            setLoadings(prevLoadings=>[...prevLoadings].filter(loading=>loading!==`${friend._id}`))
        }
    }


    return(
        <div className={`invite-modal-container ${modalVisible?"visible":""}`}>
            <div className="modal-x-button-container">
                <button className='modal-x-button' onClick={handleCloseButton} disabled={loadings.length>0}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#b9b9b9" strokeWidth="1" 
                    strokeLinecap="round" strokeLinejoin="round" className="x-img">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
            <h2 className="modal-header">Invite a Friend</h2>
            <div className="modal-text">Invite your friend to the group.</div>
            <div className="invite-modal-friend-list">
                <ul className="invite-friend-list-containter">
                    {isFriendInGroup.map((friend, index)=>(
                        <li key={index} className="invite-friend-info">
                            <img src={`/img/${friend.photo}`}/>
                            <div className="friend-invite-display-name">{friend.displayName}</div>
                            <button className={`${error.users.includes(`${friend._id}`)?
                            "friend-invite-button-err"
                            :"friend-invite-button"}`} 
                            disabled={loadings.includes(friend._id)} onClick={(e)=>handleInvite(e, friend)}>
                                {loadings.includes(friend._id)?
                                <div className="invite-user-loading"></div>
                                :
                                "Invite"}
                            </button>
                        </li>
                    ))}
                </ul>
                {
                    error.isError&&
                    <div className="invite-user-err">An error occurred. Please try again later.</div>
                }
            </div>
        </div>
    )
}   

export default InviteUserModal
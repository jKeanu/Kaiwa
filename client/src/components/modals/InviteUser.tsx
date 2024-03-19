import { FriendDetails, InviteFriend } from "../../types/generalTypes"
import { inviteFriendtoGroup } from "../../services/apiService"
import { AxiosResponse } from "axios"
import React, { useEffect } from "react"
import { useState} from "react"
import { useChannelCustomContext } from "../../context"

const InviteUserModal:React.FC<InviteFriend>=({
        channelId, 
        token, 
        currChannelMembersId, 
        socket, 
        channelNumber,
        handleCloseButton,
        setModalDisabled})=>{
    const [modalVisible, setModalVisible] = useState(false)
    const [loadings, setLoadings] = useState<string[]>([])
    const [error, setError] = useState<{isError:boolean, users:string[]}>({isError:false, users:[]})
    const {friends, setChannels} = useChannelCustomContext()


    useEffect(()=>{
        setModalVisible(true)
    }, [])

    const isFriendInGroup:FriendDetails[] = friends.filter(friend => !currChannelMembersId.includes(friend._id))
    const handleInvite = async (e:React.MouseEvent<HTMLButtonElement>, friend:FriendDetails):Promise<void> => {
        e.preventDefault()
        setModalDisabled(true)
        setLoadings(prevLoadings=>[...prevLoadings, `${friend._id}`])
        setError(prevError=>{
            return {isError:false, users:[...prevError.users].filter(user=>user!==`${friend._id}`)}
        })
        try{
            const newTime = Date.now()
            const res:AxiosResponse<{status:string}> = await inviteFriendtoGroup(token, newTime, channelId, friend._id)
            if(res.data.status === 'success'){
                setChannels(prevChannels=>{
                    const updateChannels = [...prevChannels]
                    const currChannel = updateChannels.find(channel=>channel._id===channelId)
                    if(currChannel){
                        currChannel.lastMessage = newTime
                    }
                    const sortedChannels = updateChannels.sort((a, b) => {
                        const dateA = new Date(a.lastMessage).getTime() // Convert to milliseconds
                        const dateB = new Date(b.lastMessage).getTime() // Convert to milliseconds
                        return dateB - dateA; // Compare the millisecond values
                    })
                    return sortedChannels
                })
                if(socket && channelId && channelNumber){
                    socket.emit('user_invite_success', {inviteUser:friend._id, channelId, channelNumber:Number(channelNumber)})
                }
                setLoadings(prevLoadings=>{
                    return [...prevLoadings].filter(loading=>loading!==`${friend._id}`)
                })
            }
        }
        catch(err){
            setError(prevError=>{
                return {isError:true, users:[...prevError.users, `${friend._id}`]}
            })
            setLoadings(prevLoadings=>{
                return [...prevLoadings].filter(loading=>loading!==`${friend._id}`)
            })
        }
    }

    useEffect(()=>{
        if(loadings.length===0){
            setModalDisabled(false)
            console.log('WHAT IN THE WORLD')
        }
    }, [loadings])

    const handleClose = (e:React.MouseEvent<HTMLButtonElement>):void=>{
        e.preventDefault()
        handleCloseButton(setModalVisible)
    }
    
    return(
        <div className={`invite-modal-container channel-modal ${modalVisible?"visible":""}`}>
            <div className="modal-x-button-container">
                <button className='modal-x-button' onClick={handleClose} disabled={loadings.length>0}>
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
                            <img src={`${friend.photo==='default.jpeg'?'/img/default.jpeg':friend.photoUrl}`}/>
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
import { UnfriendProps } from "../../types/generalTypes"
import { AxiosResponse } from "axios"
import { removeFriend } from "../../services/apiService"
import { useState } from "react"

const Unfriend:React.FC<UnfriendProps>=({channelId, friendId, token, socket, handleFriendChannelDelete,
    handleCloseButton, displayName, setModalSettings})=>{
    const [errorMsg, setErrorMsg] = useState({isError:true, message:''})
    const [isLoading, setIsLoading] = useState(false)

    const handleUnfriend = async (e:React.MouseEvent<HTMLButtonElement>):Promise<void>=>{
        e.preventDefault()
        setIsLoading(true)
        try{
            const res:AxiosResponse<void> = await removeFriend(token, friendId)
            if(res.status===204){
                handleFriendChannelDelete(channelId)
                if(socket){
                    socket.emit("remove_friend", {channelId, friendId})
                }
                setModalSettings({isOpen:false, ids:{channelId:'', friendId:''}, displayName:''})
                setIsLoading(false)
            }
        }catch(err){
            setIsLoading(false)
            setErrorMsg({isError:true, message:'An unknown error occurred. Please try again later.'})
        }
    }
    return(
        <div className="unfriend-modal-container">
            <h2 className="modal-header">Remove Friend</h2>
            <div className="modal-text">
                Are you sure you want to unfriend {displayName}
            </div>
            <div className="leave-group-buttons-container">
                <button className='confirm-button' onClick={(e)=>handleUnfriend(e)} disabled={isLoading}>
                    {isLoading?                    
                    <div className="confirm-button-loading">
                    </div>:
                    'Remove Friend'}
                </button>
                <button className="cancel-button" onClick={handleCloseButton} disabled={isLoading}>
                    Cancel
                </button>
            </div>
        </div>
    )
}

export default Unfriend
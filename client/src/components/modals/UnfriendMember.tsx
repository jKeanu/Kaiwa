import { MemberUnfriend} from "../../types/generalTypes"
import { AxiosResponse } from "axios"
import { removeFriend } from "../../services/apiService"
import { useEffect, useState } from "react"

const UnfriendMemberModal:React.FC<MemberUnfriend>=({channelId, memberId, token, socket, handleFriendChannelDelete,
    handleCloseButton, displayName, setModalSettings, channelNumber})=>{
    const [errorMsg, setErrorMsg] = useState({isError:false, message:''})
    const [isLoading, setIsLoading] = useState(false)
    const [modalVisible, setModalVisible] = useState(false)

    const handleUnfriend = async (e:React.MouseEvent<HTMLButtonElement>):Promise<void>=>{
        e.preventDefault()
        setIsLoading(true)
        try{
            const res:AxiosResponse<void> = await removeFriend(token, memberId)
            if(res.status===204){
                handleFriendChannelDelete(channelId)
                if(socket){
                    socket.emit("remove_friend", {channelId, memberId, channelNumber})
                }
                setModalSettings({isOpen:false, ids:{channelId:'', memberId:''}, displayName:'', type:''})
                setIsLoading(false)
            }
        }catch(err){
            setIsLoading(false)
            setErrorMsg({isError:true, message:'An unknown error occurred. Please try again later.'})
        }
    }

    useEffect(()=>{
        setModalVisible(true)
    },[])
    return(
        <div className={`unfriend-member-modal-container s-modal ${modalVisible?"visible":""}`}>
            <h2 className="modal-header">Remove Friend</h2>
            <div className="modal-text">
                Are you sure you want to unfriend {displayName}
            </div>
            <div className="unfriend-member-buttons-container s-modal-button-container">
                <button className='confirm-button' onClick={(e)=>handleUnfriend(e)} disabled={isLoading}>
                    {isLoading?                    
                    <div className="confirm-button-loading">
                    </div>:
                    'Remove Friend'}
                </button>
                <button className="cancel-button" onClick={handleCloseButton} disabled={isLoading}>
                    Cancel
                </button>
                {errorMsg.isError&&<span className="s-modal-err">{errorMsg.message}</span>}
            </div>
        </div>
    )
}

export default UnfriendMemberModal
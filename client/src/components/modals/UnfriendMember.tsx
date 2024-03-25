import { MemberUnfriend} from "../../types/generalTypes"
import { AxiosResponse } from "axios"
import { removeFriend } from "../../services/apiService"
import { useEffect, useState } from "react"
import { useChannelCustomContext } from "../../context"

const UnfriendMemberModal:React.FC<MemberUnfriend>=({channelId, memberId, token, socket,
    handleCloseButton, displayName, setModalSettings, channelNumber, setModalDisabled})=>{
    const [errorMsg, setErrorMsg] = useState({isError:false, message:''})
    const [isLoading, setIsLoading] = useState(false)
    const {handleFriendChannelDelete, modalVisible, setModalVisible} = useChannelCustomContext()

    const handleUnfriend = async (e:React.MouseEvent<HTMLButtonElement>):Promise<void>=>{
        e.preventDefault()
        setIsLoading(true)
        setModalDisabled(true)
        try{
            const res:AxiosResponse<void> = await removeFriend(token, memberId)
            if(res.status===204){
                handleFriendChannelDelete(channelId)
                if(socket){
                    socket.emit("remove_friend", {channelId, friendId:memberId, channelNumber})
                }
                setModalSettings({isOpen:false, ids:{channelId:'', memberId:''}, displayName:'', type:'', channelNumber:undefined})
                setIsLoading(false)
                setModalDisabled(false)
            }
        }catch(err){
            setIsLoading(false)
            setErrorMsg({isError:true, message:'An unknown error occurred. Please try again later.'})
            setModalDisabled(false)
        }
    }

    useEffect(()=>{
        setModalVisible(true)
        return ()=> setModalVisible(false)
    },[])


    return(
        <div className={`unfriend-member-modal-container s-modal channel-modal ${modalVisible?"visible":""}`}>
            <h2 className="modal-header">Remove Friend</h2>
            <div className="modal-text">
                Are you sure you want to unfriend {displayName}
            </div>
            <div className="unfriend-member-buttons-container s-modal-button-container channel-modal-button-container">
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
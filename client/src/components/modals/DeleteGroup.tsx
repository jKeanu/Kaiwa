import { AxiosResponse } from "axios"
import { ActionType, DeleteGroup } from "../../types/generalTypes"
import { deleteGroup } from "../../services/apiService"
import { useState } from "react"
import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useChannelCustomContext } from "../../context"


const DeleteGroupModal:React.FC<DeleteGroup>=({token, channelId, handleCloseButton,
    socket, membersId, channelNumber, setModalDisabled})=>{

    const [modalVisible, setModalVisible] = useState(false)
    const [loading, setLoading] = useState(false)
    const [errorMsg, setErrorMsg] = useState({isError:false, message:''})
    const navigate = useNavigate()

    const {channelsDispatch} = useChannelCustomContext()

    const handleGroupDelete = async(e:React.MouseEvent<HTMLButtonElement>):Promise<void>=>{
        e.preventDefault()
        setModalDisabled(true)
        setLoading(true)
        try{
            const res:AxiosResponse<void> = await deleteGroup(token, channelId)
            if(res.status === 204){
                channelsDispatch({type:ActionType.DeleteChannel, payload:{channelId}})
                if(socket){
                    socket.emit('group_channel_deleted', {channelId, membersId, channelNumber})
                }
                navigate('/@me')
                setModalDisabled(false)
                
            }
        }catch(err){
            setErrorMsg({isError:true, message:'An error occurred. Please try again later.'})
            setLoading(false)
            setModalDisabled(false)
        }
    }
    useEffect(()=>{
        setModalVisible(true)
    },[])


    const handleClose = (e:React.MouseEvent<HTMLButtonElement>):void=>{
        e.preventDefault()
        handleCloseButton(setModalVisible)
    }

    return(
        <div className={`delete-group-modal-container channel-modal s-modal ${modalVisible?"visible":""}`}>
            <h2 className="modal-header">Delete Group</h2>
            <div className="modal-text">
                Are you sure you want to delete this Channel?
            </div>
            <div className="delete-group-buttons-container s-modal-button-container channel-modal-button-container">
                <button onClick={handleGroupDelete} className="confirm-button" disabled={loading}>
                {loading?                    
                    <div className="confirm-button-loading">
                    </div>:
                    'Delete Group'}
                </button>
                <button className="cancel-button" onClick={handleClose} disabled={loading}>
                    Cancel
                </button>
                {errorMsg.isError&&<span className="s-modal-err">{errorMsg.message}</span>}
            </div>
        </div>
    )
}

export default DeleteGroupModal
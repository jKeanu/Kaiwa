import { AxiosResponse } from "axios"
import { ChangeLeader, ChannelDataStatus} from "../../types/generalTypes"
import { mutate } from "swr"
import { useState } from "react"
import { useEffect } from "react"
import { changeGroupLeader } from "../../services/apiService"


const ChangeLeaderModal:React.FC<ChangeLeader>=({token, channelId, handleCloseButton, socket,
    memberId, channelNumber, setModalSettings, displayName, setModalDisabled})=>{
    const [modalVisible, setModalVisible] = useState(false)
    const [loading, setLoading] = useState(false)
    const [errorMsg, setErrorMsg] = useState({isError:false, message:''})

    const handleLeaderChange = async(e:React.MouseEvent<HTMLButtonElement>):Promise<void>=>{
        e.preventDefault()
        setLoading(true)
        setModalDisabled(true)
        try{
            const res:AxiosResponse<{status:string}> = await changeGroupLeader(token, channelId, memberId)
            if(res.data.status==="success"){
                if(socket){
                    mutate(`api/v1/channels/${channelNumber}`, (prevChannelDataStatus:undefined|ChannelDataStatus)=>{
                        if(!prevChannelDataStatus){
                            return
                        }
                        const updateChannel = {...prevChannelDataStatus.channel}
                        updateChannel.groupLeader = memberId
                        return {status:prevChannelDataStatus.status, channel:updateChannel}
                    }, false)
                    socket.emit("group_channel_leader_change", {memberId, channelNumber})
                }
                setModalDisabled(false)
                setLoading(false)
                setModalSettings({isOpen:false, ids:{channelId:'', memberId:''}, displayName:'', type:'', channelNumber:undefined})
            }
        }catch{
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
        <div className={`delete-group-modal-container s-modal channel-modal ${modalVisible?"visible":""}`}>
            <h2 className="modal-header">Change Channel Leader</h2>
            <div className="modal-text">
                {`Are you sure you want to make ${displayName} as the leader of this Channel?`}
            </div>
            <div className="change-leader-buttons-container s-modal-button-container channel-modal-button-container">
                <button onClick={handleLeaderChange} className="confirm-button" disabled={loading}>
                {loading?                    
                    <div className="confirm-button-loading">
                    </div>:
                    'Confirm'}
                </button>
                <button className="cancel-button" onClick={handleClose} disabled={loading}>
                    Cancel
                </button>
                {errorMsg.isError&&
                <span className="s-modal-err">
                    {errorMsg.message}
                </span>}
            </div>
        </div>
    )
}

export default ChangeLeaderModal
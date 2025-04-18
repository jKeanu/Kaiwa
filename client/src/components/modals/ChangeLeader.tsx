import { AxiosResponse, isAxiosError } from "axios"
import { ChangeLeader } from "../../types/groupTypes"
import { CurrentChannel } from "../../types/channelTypes"
import { mutate } from "swr"
import { useState } from "react"
import { useEffect } from "react"
import { changeGroupLeader } from "../../api/group"
import { useChannelCustomContext } from "../../context"

const ChangeLeaderModal:React.FC<ChangeLeader>=({channelId, handleCloseButton, socket,
    memberId, channelNumber, setModalSettings, displayName, setModalDisabled})=>{
    const [loading, setLoading] = useState(false)
    const [errorMsg, setErrorMsg] = useState({isError:false, message:''})
    const {setModalVisible, modalVisible} = useChannelCustomContext()

    const handleLeaderChange = async(e:React.MouseEvent<HTMLButtonElement>):Promise<void>=>{
        e.preventDefault()
        setLoading(true)
        setModalDisabled(true)
        try{
            const res:AxiosResponse<{status:string}> = await changeGroupLeader(channelId, memberId)
            if(res.data.status==="success"){
                if(socket){
                    mutate(`api/v1/channels/${channelNumber}`, (cachedChannelData:undefined|CurrentChannel)=>{
                        if(!cachedChannelData){
                            return
                        }
                        const updateChannel = {...cachedChannelData}
                        updateChannel.groupLeader = memberId
                        return updateChannel
                    }, false)
                    socket.emit("group_channel_leader_change", {memberId, channelNumber})
                }
                setModalDisabled(false)
                setLoading(false)
                setModalVisible(false)
                setModalSettings({isOpen:false, ids:{channelId:'', memberId:''}, displayName:'', type:'', channelNumber:undefined})
            }
        }catch(err){
            if(isAxiosError(err)){
                if(err.response && (err.response.status === 400 || err.response.status === 401)){
                    setErrorMsg({isError:true, message:err.response.data.message})
                }else{
                    setErrorMsg({isError:true, message:'An error occurred. Please try again later.'})
                }
            }else{
                setErrorMsg({isError:true, message:'An error occurred. Please try again later.'})
            }
        }finally{
            setLoading(false)
            setModalDisabled(false)
        }
    }
    
    useEffect(()=>{
        setModalVisible(true)
    },[setModalVisible])


    return(
        <div className={`delete-group-modal-container s-modal channel-modal ${modalVisible?"visible":""}`}>
            <h2 className="modal-header">Change Group Leader</h2>
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
                <button className="cancel-button" onClick={handleCloseButton} disabled={loading}>
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
import { Notice } from "../../types/generalTypes"
import { useEffect, useState } from "react"

const NoticeModal:React.FC<Notice>=({channelId, handleModalConfirm})=>{
    const [modalVisible, setModalVisible] = useState(false)

    useEffect(()=>{
        setModalVisible(true)
    },[])

    return (
        <div className={`notice-modal-container ${modalVisible?"visible":""}`}>
            <h2 className="modal-header">Notice</h2>
            <div className="modal-text">
                This channel is no longer accessible.
            </div>
            <div className="notice-modal-button-container">
                <button className="confirm-button" onClick={(e)=>handleModalConfirm(e, channelId)}>Confirm</button>
            </div>
        </div>
    )
}

export default NoticeModal
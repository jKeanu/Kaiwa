import { Notice } from "../../types/generalTypes"
import { useEffect, useState } from "react"

const MessageLimitModal:React.FC<Notice>=({handleModalConfirm})=>{
    const [modalVisible, setModalVisible] = useState(false)

    useEffect(()=>{
        setModalVisible(true)
        return ()=> setModalVisible(false)
    },[])

    return (
        <div className={`message-limit-modal-container ${modalVisible?"visible":""}`}>
            <h2 className="modal-header">Whoa there, speedy fingers!</h2>
            <div className="modal-text">
                Slow down on the messages, it's not a race!
            </div>
            <div className="message-limit-modal-button-container">
                <button className="confirm-button" onClick={(e)=>handleModalConfirm(e)}>Confirm</button>
            </div>
        </div>
    )
}

export default MessageLimitModal
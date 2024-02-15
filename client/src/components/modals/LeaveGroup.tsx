import { AxiosResponse } from "axios";
import { LeaveGroup } from "../../types/generalTypes";
import { leaveGroup } from "../../services/apiService";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

const LeaveGroupModal:React.FC<LeaveGroup>=({token, channelId, handleCloseButton})=>{
    const [modalVisible, setModalVisible] = useState(false)
    const navigate = useNavigate()
    const [isLoading, setIsLoading]  = useState(false)
    const [errorMsg, setErrorMsg] = useState({isError:false, message:''})
    const handleLeaveGroup=async(e:React.MouseEvent<HTMLButtonElement>):Promise<void>=>{
        e.preventDefault()
        setIsLoading(true)
        try{
            const res:AxiosResponse<void> = await leaveGroup(token, channelId)
            if(res.status===204){
                navigate('/@me')
                setIsLoading(false)
            }
        }catch(err){
            setErrorMsg({isError:true, message:'An error occurred. Please try again later.'})
            setIsLoading(false)
        }
    }
    useEffect(()=>{
        setModalVisible(true)
    },[])
    return(
        <div className={`leave-group-modal-container s-modal ${modalVisible?"visible":""}`}>
            <h2 className="modal-header">Leave Group</h2>
            <div className="modal-text">
                Are you sure you want to leave the group?
            </div>
            <div className="leave-group-buttons-container s-modal-button-container">
                <button className='confirm-button' onClick={handleLeaveGroup} disabled={isLoading}>
                {isLoading?                    
                    <div className="confirm-button-loading">
                    </div>:
                    'Leave Group'}
                </button>
                <button className="cancel-button" onClick={handleCloseButton} disabled={isLoading}>
                    Cancel
                </button>
                {errorMsg.isError&&<span className="s-modal-err">{errorMsg.message}</span>}
            </div>
        </div>
    )
}

export default LeaveGroupModal
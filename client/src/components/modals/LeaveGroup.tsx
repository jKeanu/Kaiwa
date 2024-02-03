import { AxiosResponse } from "axios";
import { LeaveGroup } from "../../types/generalTypes";
import { leaveGroup } from "../../services/apiService";
import { useNavigate } from "react-router-dom";

const LeaveGroupModal:React.FC<LeaveGroup>=({token, channelId, handleCloseButton})=>{
    const navigate = useNavigate()
    const handleLeaveGroup=async(e:React.MouseEvent<HTMLButtonElement>):Promise<void>=>{
        e.preventDefault()
        try{
            const res:AxiosResponse<void> = await leaveGroup(token, channelId)
            if(res.status===200){
                navigate('/')
            }
        }catch(err){
            console.log(err)
        }
    }
    return(
        <div className="leave-group-modal-container">
            <h2 className="modal-header">Leave Group</h2>
            <div className="modal-text">
                Are you sure you want to leave the group?
            </div>
            <div className="leave-group-buttons-container">
                <button className='confirm-button' onClick={handleLeaveGroup}>
                    Leave Group
                </button>
                <button className="cancel-button" onClick={handleCloseButton}>
                    Cancel
                </button>
            </div>
        </div>
    )
}

export default LeaveGroupModal
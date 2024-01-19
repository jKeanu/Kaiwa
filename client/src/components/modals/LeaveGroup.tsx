import { AxiosResponse } from "axios";
import { LeaveGroup } from "../../types/generalTypes";
import { leaveGroup } from "../../services/apiService";
import { useNavigate } from "react-router-dom";

const LeaveGroupModal:React.FC<LeaveGroup>=({token, setChannelMembers, channelId})=>{
    const navigate = useNavigate()
    const handleLeaveGroup=async(e:React.MouseEvent<HTMLButtonElement>, token:string, channelId:string):Promise<void>=>{
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
            <div className="leave-group-text-container">
                Are you sure you want to leave the Group?
            </div>
            <div className="leave-group-buttons-container">
                <button onClick={(e)=>handleLeaveGroup(e, token, channelId)}>
                    Leave Group
                </button>
                <button>
                    Cancel
                </button>
            </div>
        </div>
    )
}

export default LeaveGroupModal
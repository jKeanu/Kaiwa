import { AxiosResponse } from "axios"
import { DeleteGroup } from "../../types/generalTypes"
import { deleteGroup } from "../../services/apiService"


const DeleteGroupModal:React.FC<DeleteGroup>=({token, channelId, handleCloseButton})=>{
    const handleGroupDelete = async(e:React.MouseEvent<HTMLButtonElement>):Promise<void>=>{
        e.preventDefault()
        try{
            const res:AxiosResponse<void> = await deleteGroup(token, channelId)
            if(res.status === 200){

            }
        }catch(err){
            console.log(err)
        }
    }
    return(
        <div className="delete-group-modal-container">
            <h2 className="modal-header">Delete Group</h2>
            <div className="modal-text">
                Are you sure you want to delete this Channel?
            </div>
            <div className="delete-group-buttons-container">
                <button onClick={handleGroupDelete} className="confirm-button">
                    Delete Group
                </button>
                <button className="cancel-button" onClick={handleCloseButton}>
                    Cancel
                </button>
            </div>
        </div>
    )
}

export default DeleteGroupModal
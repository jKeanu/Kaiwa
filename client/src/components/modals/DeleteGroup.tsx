import { AxiosResponse } from "axios"
import { DeleteGroup } from "../../types/generalTypes"
import { deleteGroup } from "../../services/apiService"


export const DeleteGroupModal:React.FC<DeleteGroup>=({setChannels, token, currentChannelId})=>{

    const handleGroupDelete = async(e:React.MouseEvent<HTMLButtonElement>, token:string, currentChannelId:string):Promise<void>=>{
        e.preventDefault()
        try{
            const res:AxiosResponse<void> = await deleteGroup(token, currentChannelId)
            if(res.status === 200){
                setChannels(prevChannels => {
                    return prevChannels.filter(channel => channel._id !== currentChannelId)
                })
            }
        }catch(err){
            console.log(err)
        }
    }

    return(
        <div className="delete-group-modal-container">
            <div className="delete-group-text">
                Are you sure you want to delete this Channel?
            </div>
            <div className="delete-group-buttons-container">
                <button onClick={(e)=>handleGroupDelete(e, token, currentChannelId)} className="group-delete-button">
                    Delete
                </button>
                <button className="group-delete-cancel-button">
                    Cancel
                </button>
            </div>
        </div>
    )
}
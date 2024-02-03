import { AddFriendProps } from "../../types/generalTypes";
import { addFriend } from "../../services/apiService";
import { useState } from "react";
import { AxiosResponse } from "axios";


const AddFriend:React.FC<AddFriendProps>=({token})=>{
    const [displayName, setDisplayName] = useState('')
    const [friendTag, setFriendTag] = useState('')
    const [notice, setNotice] = useState<{type:string, message:string}>({type:'', message:''})
    const [isSending, setIsSending] = useState(false)
    
    const handleAddFriend = async (e:React.FormEvent<HTMLFormElement>)=>{
        e.preventDefault()
        setIsSending(true)
        try{
            const res:AxiosResponse<{status:string}> = await addFriend(token, displayName, friendTag)
            if(res.data.status==='success'){
                setDisplayName('')
                setFriendTag('')
                setIsSending(false)
            }
        }catch(err:unknown){

        }
    }
    return(
        <section className="add-friend-section-container">
            <form className="add-friend-form" onSubmit={handleAddFriend}>
                <div className="add-friend-input-container">
                    <label htmlFor="displayName">Username</label>
                    <input autoComplete='off' value={displayName} onChange={(e)=>setDisplayName(e.target.value)} id="displayName" className="displayName-input"/>
                    <label htmlFor="friendTag">#</label>
                    <input autoComplete="off" value={friendTag} onChange={(e)=>setFriendTag(e.target.value)} type="text" id="friendTag" className="friendTag-input"/>
                    <button type="submit" className="add-friend-submit-button">{isSending?'Sending...':'Send Friend Request'}</button>
                </div>
            </form>
        </section>
    )
}

export default AddFriend
import { AddFriendProps, AddFriendStatus } from "../../types/generalTypes";
import { addFriend } from "../../services/apiService";
import { useState } from "react";
import axios, { AxiosResponse } from "axios";


const AddFriend:React.FC<AddFriendProps>=({token, socket})=>{
    const [displayName, setDisplayName] = useState('')
    const [friendTag, setFriendTag] = useState('')
    const [requestStatus, setRequestStatus] = useState<{type:string, message:string}>()
    const [isSending, setIsSending] = useState(false)
    
    const handleAddFriend = async (e:React.FormEvent<HTMLFormElement>)=>{
        e.preventDefault()
        setRequestStatus({type:'', message:''})
        setIsSending(true)
        try{
            const res:AxiosResponse<AddFriendStatus> = await addFriend(token, displayName, friendTag)
            if(res.data.status==='success'){
                setRequestStatus({type:'success', message:'Successfully sent the request!'})
                setDisplayName('')
                setFriendTag('')
                setIsSending(false)
                if(socket){
                    socket.emit('friend_request_sent', 
                    {requestedUserId:res.data.requestedUserId,
                     requestDetails:res.data.requestDetails})
                }
            }
        }catch(err:unknown){
            if(axios.isAxiosError(err)){
                if(err.response){
                    if(err.response.status===400 || err.response.status===404 || err.response.status===409){
                        setRequestStatus({type:'error', message:err.response.data.message})
                    }
                }else{
                    setRequestStatus({type:'error', message:'An unknown error occurred, please try again later.'})
                }
            }else{
                setRequestStatus({type:'error', message:'An unknown error occurred, please try again later.'})
            }
            setIsSending(false)
        }
    }
    return(
        <section className="add-friend-section-container">
            <form className="add-friend-form" onSubmit={handleAddFriend}>
                <div className="add-friend-input-container">
                    <label htmlFor="displayName">Username</label>
                    <input autoComplete='off' value={displayName} onChange={(e)=>setDisplayName(e.target.value)} id="displayName" className="displayName-input"/>
                    <label htmlFor="friendTag">#</label>
                    <input maxLength={6} autoComplete="off" value={friendTag} onChange={(e)=>setFriendTag(e.target.value.toUpperCase())} type="text" id="friendTag" className="friendTag-input"/>
                    <button type="submit" className="add-friend-submit-button">{isSending?'Sending...':'Send Friend Request'}</button>
                </div>
            </form>
            {requestStatus&&
            <span className="request-status" style={{color: `${requestStatus.type==='success'?'green':'#c93a3a'}`}}>
                {requestStatus.message}
            </span>}
        </section>
    )
}

export default AddFriend
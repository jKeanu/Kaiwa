import React, { useState } from "react"
import { CreateGroupProps, CreateGroupStatus } from "../../types/generalTypes"
import { useMemo } from "react"
import { AxiosResponse } from "axios"
import { createGroup } from "../../services/apiService"
import { useNavigate } from "react-router-dom"

const CreateGroup:React.FC<CreateGroupProps>=({token, friendsInfo, currUserId, socket,
    setChannels, handleCloseButton, setIsDisabled, setModal})=>{
    const [searchQuery, setSearchQuery] = useState('')
    const [members, setMembers] = useState([currUserId])
    const [groupName, setGroupName] = useState('')
    const [field, setField] = useState('groupName')
    const [createGroupErr, setCreateGroupErr] = useState({err:false, type:'', message:''})
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()

    const filteredFriends = useMemo(()=>{
        return [...friendsInfo].filter(friends=>friends.displayName.toLowerCase().includes(searchQuery.toLocaleLowerCase()))
    }, [searchQuery, friendsInfo])

    const handleCheckBox = (e:React.ChangeEvent<HTMLInputElement>)=>{
        const {checked, value} = e.target
        setMembers(prevMembers=>{
            return checked?[...prevMembers, value]:[...prevMembers].filter(member=>member!==value)
        })
    }
    const handleGroupName = (e:React.MouseEvent<HTMLButtonElement>):void=>{
        e.preventDefault()
        if(groupName===''){
            setCreateGroupErr({err:true, type:'groupName', message:'Please provide a name for your channel.'})
        }else{
            setCreateGroupErr({err:false, type:'', message:''})
            setField('memberSelect')
        }
    }

    const handleBackButton = (e:React.MouseEvent<HTMLButtonElement>):void=>{
        e.preventDefault()
        setCreateGroupErr({err:false, type:'', message:''})
        setField('groupName')
    }

    const handleCreateGroup = async (e:React.FormEvent<HTMLFormElement>):Promise<void>=>{
        e.preventDefault()
        setLoading(true)
        setIsDisabled(true)
        try{
            const res:AxiosResponse<CreateGroupStatus> = await createGroup(token, members, groupName)
            const {members:newMembers, __v, ...newChannel} = {...res.data.newChannel}
            if(res.status===201&&res.data.status==="success"){
                setChannels(prevChannels=>{
                    return [newChannel, ...prevChannels]
                })
                if(socket){
                    socket.emit('new_group_channel_created', {newMembers, newChannel})
                }
                setIsDisabled(false)
                navigate(`channels/${newChannel.channelNumber}`)
                setModal(false)
                setLoading(false)
            }
        }catch(err){
            console.log(err)
            setCreateGroupErr({err:true, type:'createErr', message:'An unknown error occurred. Please try again later.'})
        }
    }


    return(
        <div className="create-group-modal-container">
            <div className="modal-x-button-container">
                <button disabled={loading} className='modal-x-button' onClick={handleCloseButton}>Close</button>
            </div>
            <h2 className="modal-header">Create Group</h2>
            <div className="modal-text">{field==="groupName"?"Give your channel a name. You can change it later.":
            "Form a new group with your friends"}</div>
            {field==='memberSelect'&&
            <input className="create-group-search" placeholder="Search friends..."
            value={searchQuery} onChange={(e)=>setSearchQuery(e.currentTarget.value)}/>}
            <form className="create-group-form" onSubmit={handleCreateGroup}>
            {(createGroupErr.err&&createGroupErr.type==='createErr')&&
                <div className="create-group-err">{createGroupErr.message}</div>}
                {field==='groupName'?
                <div className="group-name-container">  
                    <label className="group-name-label" htmlFor="group-name-input">Channel Name</label>
                    <input id="group-name-input" className="group-name-input" value={groupName} onChange={(e)=>setGroupName(e.currentTarget.value)}/>
                    {(createGroupErr.err&&createGroupErr.type==='groupName')&&
                    <div className="group-name-error">{createGroupErr.message}</div>}
                </div>
                :
                <ul className="create-group-modal-friend-list">
                {filteredFriends.map((friend, index)=>(
                    <li key={index} className="friend-checkbox-container">
                        <div className="friend-checkbox-info">
                            <img src={`/img/${friend.photo}`}/>
                            <span>{friend.displayName}</span>
                        </div>
                        <label htmlFor={`checkbox-${friend._id}`} className="checkbox-container">
                            <input id={`checkbox-${friend._id}`} checked={members.includes(friend._id)?true:false}
                            type="checkbox" value={friend._id} onChange={(e)=>handleCheckBox(e)}/>
                            <div className="checkmark"></div>
                        </label>
                    </li>
                ))}
                </ul>}
                <div className="create-group-button-container">
                    {field==='groupName'?
                    <>
                    <button type="button" className="group-name-confirm" onClick={handleGroupName}>Confirm</button>
                    </>:
                    <>
                        <button disabled={loading} onClick={handleBackButton} className="create-group-back-button" type="button">Back</button>                        
                        <button className="create-group-button" type="submit" disabled={loading} style={{justifyContent:`${loading?"center":"space-between"}`}}>
                        {loading?
                        <div className="create-group-loading"></div>
                        :
                        <>
                            <span>
                                Create Group
                            </span>
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" 
                            fill="none" stroke="#b9b9b9" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" 
                            className="create-plus">
                                <line x1="12" y1="5" x2="12" y2="19"></line>
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                            </svg>
                        </>}
                        </button>
                    </>}
                </div>
            </form>
        </div>
    )
}


export default CreateGroup
import React, { useEffect, useState } from "react"
import { ActionType, CreateGroup, CreateGroupStatus } from "../../types/generalTypes"
import { useMemo } from "react"
import { AxiosResponse } from "axios"
import axios from 'axios'
import { createGroup } from "../../services/apiService"
import { useNavigate } from "react-router-dom"
import { useLeftCustomContext } from "../../context"

const CreateGroupModal:React.FC<CreateGroup>=({currUserId, setIsDisabled, setModal, handleCloseButton})=>{
    const [searchQuery, setSearchQuery] = useState('')
    const [members, setMembers] = useState([currUserId])
    const [groupName, setGroupName] = useState('')
    const [field, setField] = useState('groupName')
    const [createGroupErr, setCreateGroupErr] = useState({err:false, type:'', message:''})
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()

    const {friendsInfo, channelsDispatch, socket, token, setModalVisible, modalVisible} = useLeftCustomContext()

    const filteredFriends = useMemo(()=>{
        return [...friendsInfo].filter(friends=>friends.displayName.toLowerCase().includes(searchQuery.toLocaleLowerCase()))
            .sort((a, b)=> a.displayName.localeCompare(b.displayName))
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

    const handleCreateGroup = async (e:React.MouseEvent<HTMLButtonElement >):Promise<void>=>{
        e.preventDefault()
        setLoading(true)
        setIsDisabled(true)
        try{
            const res:AxiosResponse<CreateGroupStatus> = await createGroup(token, members, groupName)
            const {members:newMembers, __v, ...newChannel} = {...res.data.newChannel}
            if(res.data.status==="success"){
                channelsDispatch({type:ActionType.NewChannel, payload:{data:newChannel}})
                if(socket){
                    socket.emit('new_group_channel_created', {newMembers, newChannel})
                }
                setIsDisabled(false)
                navigate(`channels/${newChannel.channelNumber}`)
                setModal({active:false, type:''})
                setLoading(false)
                setModalVisible(false)
            }
        }catch(err:unknown){
            if (axios.isAxiosError(err)){
                if(err.response?.status===400 || err.response?.status === 409){
                    if (err.response.data.message.split('. ').length>1){
                        setCreateGroupErr({err:true, type:'createErr', message:err.response.data.message.split('. ')[1]})
                    }else{
                        setCreateGroupErr({err:true, type:'createErr', message:err.response.data.message})
                    }
                }else if(err.response?.status===429){
                    setCreateGroupErr({err:true, type:'createErr', message:'Too many group creation detected, please try again later.'})
                }
                else{
                    setCreateGroupErr({err:true, type:'createErr', message:'An unknown error occurred. Please try again later.'})
                }
            }else{
                setCreateGroupErr({err:true, type:'createErr', message:'An unknown error occurred. Please try again later.'})
            }
            setLoading(false)
            setIsDisabled(false)
        }
    }

    useEffect(()=>{
        setModalVisible(true)
    },[])


    return(
        <div className={`create-group-modal-container ${modalVisible?'visible':''}`}>
            <div className="modal-x-button-container create-group-top-container">
                <div className="create-group-top">
                    <button disabled={loading} className='modal-x-button-mob' onClick={handleCloseButton}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#b9b9b9" strokeWidth="1" 
                            strokeLinecap="round" strokeLinejoin="round" className="x-img">
                            <line x1="18" y1="6" x2="6" y2="18">
                            </line>
                            <line x1="6" y1="6" x2="18" y2="18">
                            </line>
                        </svg>
                    </button>
                    <h2 className="create-group-mob-header">Create Group</h2>      
                    <button className="create-group-button" onClick={handleCreateGroup} disabled={loading} 
                    style={{justifyContent:`${loading?"center":"space-between"}`}}>
                        {loading?
                        <div className="create-group-loading"></div>
                        :
                        <span>
                            Create
                        </span>
                        }
                    </button>
                </div>
                <button disabled={loading} className='modal-x-button' onClick={handleCloseButton}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#b9b9b9" strokeWidth="1" 
                    strokeLinecap="round" strokeLinejoin="round" className="x-img">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
            <h2 className="modal-header">Create Group</h2>
            <div className={`create-group-sections ${field==='memberSelect'?'member-select-section':'group-name-section'}`}>
                <div className={`create-group-modal-name-container ${field==='memberSelect'?'name-container-after':''}`}>
                    <div className="modal-text">
                        Give your channel a name. You can change it later.
                    </div>
                    {createGroupErr&&
                        <div className="create-group-error">
                            {createGroupErr.message}
                        </div>
                    }
                    <div className="group-name-container">  
                        <label className="group-name-label" htmlFor="group-name-input" >Channel Name</label>
                        <input id="group-name-input" maxLength={12} className="group-name-input" value={groupName} 
                        onChange={(e)=>setGroupName(e.currentTarget.value)} placeholder="Enter your group name..."/>
                        {(createGroupErr.err&&createGroupErr.type==='groupName')&&
                        <div className="group-name-error">{createGroupErr.message}</div>}
                    </div>
                    <div className="create-group-button-container">
                        <button type="button" className="group-name-confirm" onClick={handleGroupName}>Confirm</button>
                    </div>
                </div>
                <input className="create-group-search-mob" placeholder="Search friends..."
                value={searchQuery} onChange={(e)=>setSearchQuery(e.currentTarget.value)} id="friend-search-mob-create-group"/>
                <div className={`create-group-modal-invite-container ${field==='memberSelect'?'invite-container-active':''}`}>
                    <div className="modal-text">
                        Form a new group with your friends
                    </div>
                    <input className="create-group-search" placeholder="Search friends..."
                    value={searchQuery} onChange={(e)=>setSearchQuery(e.currentTarget.value)} id="search-friend-create-group"/>
                    <div className="create-group-form">
                        {(createGroupErr.err&&createGroupErr.type==='createErr')&&
                        <div className="create-group-err">{createGroupErr.message}</div>}
                        <ul className="create-group-modal-friend-list">
                        {filteredFriends.map((friend, index)=>(
                            <li key={index} className="friend-checkbox-container">
                                <div className="friend-checkbox-info">
                                    <img src={`${friend.photo==='default.jpeg'?'/img/default.jpeg':friend.photoUrl}`}/>
                                    <span>{friend.displayName}</span>
                                </div>
                                <label htmlFor={`checkbox-${friend._id}`} className="checkbox-container">
                                    <input id={`checkbox-${friend._id}`} checked={members.includes(friend._id)?true:false}
                                    type="checkbox" value={friend._id} onChange={(e)=>handleCheckBox(e)}/>
                                    <div className="checkmark"></div>
                                </label>
                            </li>
                        ))}
                        </ul>
                        <div className="create-group-button-container">
                            <button disabled={loading} onClick={handleBackButton} className="create-group-back-button" type="button">Back</button>                        
                            <button className="create-group-button" type="submit" disabled={loading} 
                            style={{justifyContent:`${loading?"center":""}`}} onClick={handleCreateGroup}>
                            {loading?
                            <div className="create-group-loading"></div>
                            :
                            <span>
                                Create
                            </span>
                                }
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            
        </div>
    )
}


export default CreateGroupModal
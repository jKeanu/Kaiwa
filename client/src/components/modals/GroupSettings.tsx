import React, { useEffect, useState, useMemo} from "react"
import { GroupSettingsProps, UpdateGroupStatus } from "../../types/generalTypes"
import axios, { AxiosResponse } from "axios"
import { changeGroupSettings } from "../../services/apiService"
import { useChannelCustomContext } from "../../context"

const GroupSettingsModal:React.FC<GroupSettingsProps>=
    ({ 
        token, 
        channelId, 
        channelName, 
        groupPhoto, 
        groupPhotoUrl,
        setCurrentChannel,
        handleCloseButton,
        setModalWindow,
        setModalDisabled})=>{
    const [groupFormData, setGroupFormData] = useState<{channelName:string, groupProfileImage:File|null}>
    ({channelName:channelName, groupProfileImage:null})
    const [isLoading, setIsLoading] = useState(false)
    const [groupSettErr, setGroupSettErr] = useState({err:false, message:''})
    
    const profileImagePreview = useMemo(()=>{
        return groupFormData.groupProfileImage?URL.createObjectURL(groupFormData.groupProfileImage):null
    }, [groupFormData.groupProfileImage])

    const {setModalVisible, modalVisible} = useChannelCustomContext()

    useEffect(()=>{
        setModalVisible(true)
    },[])

    const handleSubmit = async (e:React.FormEvent<HTMLFormElement>):Promise<void>=>{
        e.preventDefault()
        setIsLoading(true)
        setGroupSettErr({err:false, message:''})
        setModalDisabled(true)
        try{
            if(groupFormData.channelName===channelName&&!groupFormData.groupProfileImage){
                setGroupSettErr({err:true, message:'There are no changes.'})
                setIsLoading(false)
                setModalDisabled(false)
                return 
            }
            const formData = new FormData()
            if(groupFormData.channelName!==channelName) formData.append('channelName', groupFormData.channelName)
            if(groupFormData.groupProfileImage){
                formData.append('currPhoto', groupPhoto)
                formData.append('groupProfileImage', groupFormData.groupProfileImage)
            }
            const res:AxiosResponse<UpdateGroupStatus> = await changeGroupSettings(token, channelId, formData)
            if(res.data.status==='success'){
                setCurrentChannel(prevChannelData=>{
                    if(prevChannelData){
                        return {
                            ...prevChannelData,
                            ...res.data.group
                        }
                    }
                })
                setIsLoading(false)
                setModalDisabled(false)
                setModalVisible(false)
                setModalWindow({isOpen:false, window:''})
            }
        }catch(err:unknown){
            if(axios.isAxiosError(err)){
                if(err.response?.status===429){
                    setGroupSettErr({err:true, message:'Too many group setting change attempts were detected, please try again later.'})
                }else if(err.response?.status === 400){
                    let errMessages = err.response.data.message
                    if(errMessages.split('. ').length>1){
                        errMessages = errMessages.split('. ')[1]
                        setGroupSettErr({err:true, message: errMessages})
                    }else{
                        setGroupSettErr({err:true, message: 'There was an error changing group settings.'})
                    }
                }else{
                    setGroupSettErr({err:true, message: 'There was an error changing group settings.'})
                }
            }else{
                setGroupSettErr({err:true, message:'There was a problem changing the group channel information.'})
            }
            setIsLoading(false)
            setModalDisabled(false)
        }
    }


    const handleFileChange = (e:React.ChangeEvent<HTMLInputElement>):void=>{
        e.preventDefault()
        setGroupFormData(prevData=>{
            return {
                ...prevData,
                groupProfileImage: e.target.files?e.target.files[0]:null
            }
        })
    } 

    const handleChange = (e:React.ChangeEvent<HTMLInputElement>):void=>{
        e.preventDefault()
        const {name, value}  = e.target
        setGroupFormData(prevData=>{
            return {
                ...prevData,
                [name]: value
            }
        })
    }

    
    return(
        <div className={`${modalVisible?'visible':''} group-settings-modal-container`}>
            <div className="group-setting-x-button-container">
                <button className="group-setting-x-button" disabled={isLoading} onClick={handleCloseButton}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#b9b9b9" strokeWidth="1" 
                        strokeLinecap="round" strokeLinejoin="round" className="x-img">
                        <line x1="18" y1="6" x2="6" y2="18">
                        </line>
                        <line x1="6" y1="6" x2="18" y2="18">
                        </line>
                    </svg>
                </button>
            </div>
            <form className="group-settings-form" onSubmit={handleSubmit}>
                <div className="group-photo-input-containter">
                    <label className="group-photo-input-label" htmlFor="group-setting-photo">
                        <img src={`${profileImagePreview?profileImagePreview:groupPhoto==='default.jpeg'?'/img/default.jpeg':groupPhotoUrl}`} 
                            className="group-setting-img" alt={channelName + " group profile photo"}/>
                        <div className="photo-input-hover">Change</div>
                    </label>
                    <input type="file" name="profileImage"
                    id="group-setting-photo" onChange={handleFileChange} className="group-setting-photo-input"/>
                </div>
                <div className="group-info-input-container">
                    <label htmlFor="channel-name-input" className="group-setting-input-label">
                        Channel Name
                    </label>
                    <input id="channel-name-input" className="group-setting-input" value={groupFormData.channelName}
                     onChange={handleChange} name="channelName"/>
                </div>
                <div className="group-setting-button-container">
                    <button className="group-setting-button" type="submit" disabled={isLoading}>
                        {isLoading?
                    <div className="group-setting-loading"></div>
                        :'Change'}
                    </button>
                </div>
                {groupSettErr.err&&
                <div className="group-sett-error">
                    {groupSettErr.message}
                </div>}
            </form>
        </div>
    )
}

export default GroupSettingsModal
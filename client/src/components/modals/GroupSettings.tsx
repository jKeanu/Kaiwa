import React, { useEffect, useState, useMemo} from "react"
import { GroupSettingsProps, UpdateGroupStatus } from "../../types/generalTypes"
import axios, { AxiosResponse } from "axios"
import { changeGroupSettings } from "../../services/apiService"

const GroupSettingsModal:React.FC<GroupSettingsProps>=
    ({  socket, 
        token, 
        channelId, 
        channelName, 
        groupPhoto, 
        groupPhotoUrl,
        setCurrentChannel})=>{
    const [modalVisible, setModalVisible] = useState(false)
    const [groupFormData, setGroupFormData] = useState<{channelName:string, groupProfileImage:File|null}>
    ({channelName:channelName, groupProfileImage:null})
    const [isLoading, setIsLoading] = useState(false)
    const [groupSettErr, setGroupSettErr] = useState({err:false, message:''})
    const profileImagePreview = useMemo(()=>{
        return groupFormData.groupProfileImage? URL.createObjectURL(groupFormData.groupProfileImage):null
    }, [groupFormData.groupProfileImage])

    useEffect(()=>{
        setModalVisible(true)
    }, [])

    const handleSubmit = async (e:React.FormEvent<HTMLFormElement>):Promise<void>=>{
        e.preventDefault()
        setIsLoading(true)
        setGroupSettErr({err:false, message:''})
        try{
            if(groupFormData.channelName===channelName&&!groupFormData.groupProfileImage){
                setGroupSettErr({err:true, message:'There is no changes in the current group information.'})
                setIsLoading(false)
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
            }
        }catch(err:unknown){
            if(axios.isAxiosError(err)){
                setGroupSettErr({err:false, message:err.response?.data.message})
            }
            setIsLoading(false)
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
            <form className="group-settings-form" onSubmit={handleSubmit}>
                <div className="group-photo-input-containter">
                    <label className="group-photo-input-label" htmlFor="group-setting-photo">
                        <img src={`${profileImagePreview?profileImagePreview:groupPhoto==='default.jpeg'?'/img/default.jpeg':groupPhotoUrl}`} 
                            className="group-setting-img" />
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
                    <button className="group-setting-button" type="submit">
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
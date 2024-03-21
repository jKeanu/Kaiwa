import React, { useEffect, useState, useMemo} from "react"
import { GroupSettingsProps } from "../../types/generalTypes"

const GroupSettingsModal:React.FC<GroupSettingsProps>=({socket, token, channelId, channelName, groupPhoto, groupPhotoUrl})=>{
    const [modalVisible, setModalVisible] = useState(false)
    const [groupFormData, setGroupFormData] = useState<{channelName:string, groupProfileImage:File|null}>({channelName:'', groupProfileImage:null})

    const profileImagePreview = useMemo(()=>{
        return groupFormData.groupProfileImage? URL.createObjectURL(groupFormData.groupProfileImage):null
    }, [groupFormData.groupProfileImage])

    useEffect(()=>{
        setModalVisible(true)
    }, [])

    const handleSubmit = (e:React.FormEvent<HTMLFormElement>):void=>{

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

    return(
        <div className={`${modalVisible?'visible':''} group-settings-modal-container`}>
            <form className="group-settings-form">
                <div className="group-photo-input-containter">
                    <label className="group-photo-input-label">
                        <img src={`${profileImagePreview?profileImagePreview:groupPhoto==='default.jpeg'?'/img/default.jpeg':groupPhotoUrl}`} 
                            className="group-setting-photo"/>
                        <div className="photo-input-hover">Change</div>
                    </label>
                </div>
                <input type="file" name="profileImage" id="group-setting-photo" onChange={handleFileChange} className="group-setting-photo-input"/>
            </form>
        </div>
    )
}
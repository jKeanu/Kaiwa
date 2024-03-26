import axios, { AxiosResponse } from "axios"
import { useLeftCustomContext } from "../../context"
import { ProfileSettings, UpdateUserStatus} from "../../types/generalTypes"
import React, { useEffect, useMemo, useState } from "react"
import { changeUserPassword, updateCurrentUser } from "../../services/apiService"


const ProfileSettingsModal:React.FC<ProfileSettings>=({currUserData, setModal, handleCloseButton, setIsDisabled})=>{
    const [userInfo, setUserInfo] = useState<{displayName:string, friendTag:string, profileImage:null|File}>
    ({displayName:currUserData.displayName, friendTag:currUserData.friendTag, profileImage:null})
    const [userPassword, setUserPassword] = useState({currentPassword:'', password:'', passwordConfirm:''})
    const [currSetting, setCurrSetting] = useState('userInfo')
    const [userSettErr, setUserSettErr] = useState({err:false, message:''})
    const [isLoading, setIsLoading] = useState(false)
    const {socket, token, setUserData, setToken, setModalVisible, modalVisible} = useLeftCustomContext()
    const profileImagePreview = useMemo(()=>{
        return userInfo.profileImage? URL.createObjectURL(userInfo.profileImage):null
    }, [userInfo.profileImage])


    const handleUserInfoSubmit = async (e:React.FormEvent<HTMLFormElement>):Promise<void>=>{
        e.preventDefault()
        setIsLoading(true)
        setIsDisabled(true)
        setUserSettErr({err:false, message:''})
        try{
            const formData = new FormData()
            if(userInfo.displayName!==currUserData.displayName) formData.append('displayName', userInfo.displayName)
            if(userInfo.friendTag!==currUserData.friendTag) formData.append('friendTag', userInfo.friendTag)
            if(userInfo.profileImage){
                formData.append('profileImage', userInfo.profileImage)
                formData.append('currPhoto', currUserData.photo)
            }
            const res:AxiosResponse<UpdateUserStatus> = await updateCurrentUser(token, formData)
            if(res.data.status==='success'){
                setUserData(prevUserData=>{
                    if(prevUserData){
                        return {
                            ...prevUserData,
                            ...res.data.user
                        }
                    }
                })
                }
            setIsLoading(false)
            setModal({active:false, type:''})
            setIsDisabled(false)
        }catch(err:unknown){
            if(axios.isAxiosError(err)){
                if(err.response?.status===409){
                    setUserSettErr({err:true, message:err.response.data.message})
                }else if(err.response?.status===400){
                    let errMessages = err.response.data.message
                    if(errMessages.split('. ').length>1){
                        errMessages = errMessages.split('. ')[1]
                        setUserSettErr({err:true, message: errMessages})
                    }else{
                        setUserSettErr({err:true, message: 'There was an error changing the user password.'})
                    }
                }else{
                    setUserSettErr({err:true, message:'There was an error changing the user information.'})
                }
            }else{
                setUserSettErr({err:true, message:'There was an error changing the user information.'})
            }  
        }
        setIsLoading(false)
        setIsDisabled(false) 
    }

    const handleUserPasswordSubmit = async (e:React.FormEvent<HTMLFormElement>):Promise<void>=>{
        e.preventDefault()
        setIsLoading(true)
        setIsDisabled(true)
        setUserSettErr({err:false, message:''})
        try{
            const res:AxiosResponse<{status:string, token:string}>= await changeUserPassword(token, userPassword)
            if(res.data.status==='success'){
                setToken('')
                setIsDisabled(false)
                localStorage.removeItem('token')
                window.location.href = '/login'
            }
        }catch(err: unknown){
            if(axios.isAxiosError(err)){
                if(err.response?.status === 401){
                    setUserSettErr({err:true, message: err.response.data.message})
                }else if(err.response?.status === 400){
                    let errMessages = err.response.data.message
                    if(errMessages.split('. ').length>1){
                        errMessages = errMessages.split('. ')[1]
                        setUserSettErr({err:true, message: errMessages})
                    }else{
                        setUserSettErr({err:true, message: 'There was an error changing the user password.'})
                    }
                }else{
                    setUserSettErr({err:true, message: 'There was an error changing the user password.'})
                }
            }else{
                setUserSettErr({err:true, message: 'There was an error changing the user password.'})
            }
            setIsDisabled(false)
            setIsLoading(false)
        }
    }

    const handleUserInfoChange = (e:React.ChangeEvent<HTMLInputElement>):void=>{
        e.preventDefault()
        const {name, value}  = e.target
        setUserInfo(prevUserInfo=>{
            return {
                ...prevUserInfo,
                [name]: name==='friendTag'?value.toUpperCase():value
            }
        })
    }

    const handleUserPasswordChange = (e:React.ChangeEvent<HTMLInputElement>):void=>{
        e.preventDefault()
        const {name, value} = e.target
        setUserPassword(prevUserPassword=>{
            return {
                ...prevUserPassword,
                [name]:value
            }
        })
    }

    const handleFileChange = (e:React.ChangeEvent<HTMLInputElement>):void=>{
        e.preventDefault()
        setUserInfo(prevUserInfo=>{
            return {
                ...prevUserInfo,
                profileImage: e.target.files?e.target.files[0]:null
            }
        })
    } 

    const handleUserInfoClick = (e:React.MouseEvent<HTMLButtonElement>):void=>{
        e.preventDefault()
        setCurrSetting('userInfo')
        setUserSettErr({err:false, message:''})
    }

    const handleUserPassClick =  (e:React.MouseEvent<HTMLButtonElement>):void=>{
        e.preventDefault()
        setCurrSetting('userPassword')
        setUserSettErr({err:false, message:''})
    }
    
    useEffect(()=>{
        setModalVisible(true)
    },[])

    return(
        <div className={`profile-settings-modal-container ${modalVisible?'visible':''}`}>
            <div className="profile-settings-x-button-container">
                <button className="x-button" disabled={isLoading} onClick={handleCloseButton}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#b9b9b9" strokeWidth="1" 
                        strokeLinecap="round" strokeLinejoin="round" className="x-img">
                        <line x1="18" y1="6" x2="6" y2="18">
                        </line>
                        <line x1="6" y1="6" x2="18" y2="18">
                        </line>
                    </svg>
                </button>
            </div>
            <div className="profile-settings-buttons-container">
                <button onClick={handleUserInfoClick} disabled={isLoading}
                style={{borderBottom:`${currSetting==='userInfo'?'1px solid #b9b9b9':''}`}}>
                    User Information
                </button>
                <button onClick={handleUserPassClick} disabled={isLoading}
                style={{borderBottom:`${currSetting==='userPassword'?'1px solid #b9b9b9':''}`}}>
                    Change Password
                </button>
            </div>
            <div className="profile-settings">
                <form className={`user-info-form ${currSetting==='userPassword'?'inactive':''} user-settings-form`}
                onSubmit={handleUserInfoSubmit}>
                    <div className="user-photo-input-container">
                        <label htmlFor="user-setting-photo">
                            <img src={`${profileImagePreview?profileImagePreview:currUserData.photo==='default.jpeg'?'/img/default.jpeg':currUserData.photoUrl}`} 
                            className="user-setting-photo"/>
                            <div className="photo-input-hover">Change</div>
                        </label>
                        <input type="file" name="profileImage" id="user-setting-photo" onChange={handleFileChange} className="user-setting-photo-input"/>
                    </div>
                    <div className="user-info-input-containter">
                        <label className="user-setting-input-label" htmlFor="user-setting-email">
                            Email
                        </label>
                        <input className="user-email-input user-info-input" id="user-setting-email" disabled={true} 
                        name="email" placeholder={`${currUserData.email}`}/>
                        <label className="user-setting-input-label" htmlFor="user-setting-displayName">
                            Display Name
                        </label>
                        <input className="user-display-name-input user-info-input" id="user-setting-displayName" 
                        value={userInfo.displayName} name="displayName" onChange={handleUserInfoChange}
                        placeholder={`${currUserData.displayName}`}/>
                        <label className="user-setting-input-label" htmlFor="user-setting-friendTag">
                            Friend Tag
                        </label>
                        <input className="user-friend-tag-input user-info-input" id="user-setting-friendTag" maxLength={6}
                        value={userInfo.friendTag} name="friendTag" onChange={handleUserInfoChange}
                        placeholder={`${currUserData.friendTag}`}/>
                    </div>
                    <div className="user-info-button-container user-settings-button-container">
                        <button className="user-info-submit" type="submit" disabled={isLoading}>
                            {isLoading?
                                <div className="user-setting-loading"></div>
                            :'Submit'}
                        </button>
                    </div>
                    {userSettErr.err&&
                    <div className="user-sett-error">
                        {userSettErr.message}
                    </div>}
                </form>
                <form className={`user-password-form ${currSetting==='userPassword'?'active':''} user-settings-form`} onSubmit={handleUserPasswordSubmit}>
                    <div className="user-password-sett-notice">
                        After a successful password change, you will be redirected to the login page.
                    </div>
                    <div className="user-password-input-container">
                        <label className="user-setting-input-label" htmlFor="user-setting-currentPassword">
                            Current Password
                        </label>
                        <input type="password" className="user-password-input user-current-password-input" onChange={handleUserPasswordChange}
                        name="currentPassword" id="user-setting-currentPassword" value={userPassword.currentPassword} required={true}/>
                        <label className="user-setting-input-label" htmlFor="user-setting-password">
                            New Passsword
                        </label>
                        <input type="password" className="user-password-input user-password-input" onChange={handleUserPasswordChange}
                        name="password" id="user-setting-password" value={userPassword.password} required={true}/>
                        <label className="user-setting-input-label" htmlFor="user-setting-passwordConfirm">
                            Confirm Passsword
                        </label>
                        <input type="password" className="user-password-input user-password-confirm-input" onChange={handleUserPasswordChange}
                        name="passwordConfirm" id="user-setting-passwordConfirm" value={userPassword.passwordConfirm} required={true}/>
                    </div>
                    <div className="user-password-button-container user-settings-button-container" >
                        <button className="user-password-submit user-setting-submit" type="submit" disabled={isLoading}>
                            {isLoading?
                                <div className="user-setting-loading"></div>
                            :'Change Password'}
                        </button>
                    </div>
                    {userSettErr.err&&
                    <div className="user-sett-error" >
                        {userSettErr.message}
                    </div>}
                </form>
            </div>
        </div>
    )
}

export default ProfileSettingsModal
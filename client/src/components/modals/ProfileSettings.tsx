import { useLeftCustomContext } from "../../context"
import { ProfileSettings } from "../../types/generalTypes"
import React, { useEffect, useState } from "react"


const ProfileSettingsModal:React.FC<ProfileSettings>=({currUserData, setModal})=>{
    const [userInfo, setUserInfo] = useState({displayName:currUserData.displayName, friendTag:currUserData.friendTag, photo:''})
    const [userPassword, setUserPassword] = useState({currentPassword:'', password:'', passwordConfirm:''})
    const [currSetting, setCurrSetting] = useState('userInfo')
    const [modalVisible, setModalVisible] = useState(false)

    const {socket, token} = useLeftCustomContext()

    const handleUserInfoSubmit = (e:React.FormEvent<HTMLFormElement>):void=>{
        
    }

    const handleUserPasswordSubmit = (e:React.FormEvent<HTMLFormElement>):void=>{

    }

    const handleUserInfoChange = (e:React.ChangeEvent<HTMLInputElement>):void=>{
        const {name, value}  = e.target
        setUserInfo(prevUserInfo=>{
            return {
                ...prevUserInfo,
                [name]: value
            }
        })
    }

    const handleUserPasswordChange = (e:React.ChangeEvent<HTMLInputElement>):void=>{
        const {name, value} = e.target
        setUserPassword(prevUserPassword=>{
            return {
                ...prevUserPassword,
                [name]:value
            }
        })
    }

    useEffect(()=>{
        setModalVisible(true)
    }, [])
    return(
        <div className={`profile-settings-modal-container ${modalVisible?'visible':''}`}>
            <div className="profile-settings-buttons-container">
                <button onClick={()=>setCurrSetting('userInfo')}>
                    User Information
                </button>
                <button onClick={()=>setCurrSetting('userPassword')}>
                    Change Password
                </button>
            </div>
            <div className="profile-settings">
                <form className={`user-info-form ${currSetting==='userPassword'?'inactive':''} user-settings-form`}
                onSubmit={handleUserInfoSubmit}>
                    <div className="user-photo-input-container">
                        <label htmlFor="photo">
                            <img src={`/img/${currUserData.photo}`} className="user-setting-photo"/>
                        </label>
                        <input type="file" name="photo" id="photo" className="user-setting-photo-input"/>
                    </div>
                    <div className="user-info-input-containter">
                        <label className="user-setting-input-label" htmlFor="Email">
                            Email
                        </label>
                        <input className="user-email-input user-info-input" id="email" disabled={true} 
                        value={currUserData.email} name="email"/>
                        <label className="user-setting-input-label" htmlFor="displayName">
                            Display Name
                        </label>
                        <input className="user-display-name-input user-info-input" id="displayName" 
                        value={userInfo.displayName} name="displayName" onChange={handleUserInfoChange}/>
                        <label className="user-setting-input-label" htmlFor="friendTag">
                            Friend Tag
                        </label>
                        <input className="user-friend-tag-input user-info-input" id="friendTag" maxLength={6}
                        value={userInfo.friendTag} name="friendTag" onChange={handleUserInfoChange}/>
                    </div>
                    <div className="user-info-button-container user-settings-button-container">
                        <button className="user-info-submit" type="submit">
                            Submit
                        </button>
                    </div>
                </form>
                <form className={`user-password-form ${currSetting==='userPassword'?'active':''} user-settings-form`} onSubmit={handleUserPasswordSubmit}>
                    <div className="user-password-input-container">
                        <label className="user-setting-input-label" htmlFor="currentPassword">
                            Current Password
                        </label>
                        <input className="user-password-input user-current-password-input" onChange={handleUserPasswordChange}
                        name="currentPassword" id="currentPassword" value={userPassword.currentPassword}/>
                        <label className="user-setting-input-label" htmlFor="password">
                            New Passsword
                        </label>
                        <input className="user-password-input user-password-input" onChange={handleUserPasswordChange}
                        name="password" id="password" value={userPassword.password}/>
                        <label className="user-setting-input-label" htmlFor="passwordConfirm">
                            Confirm Passsword
                        </label>
                        <input className="user-password-input user-password-confirm-input" onChange={handleUserPasswordChange}
                        name="passwordConfirm" id="passwordConfirm" value={userPassword.passwordConfirm}/>
                    </div>
                    <div className="user-password-button-container user-settings-button-container">
                        <button className="user-password-submit user-setting-submit" type="submit">
                            Submit
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default ProfileSettingsModal
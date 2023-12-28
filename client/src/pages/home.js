import { useState, useEffect } from 'react';
import {useNavigate} from 'react-router-dom'
import {jwtDecode} from 'jwt-decode'
import axios from 'axios';

const HomePage = ()=>{
    const navigate = useNavigate()
    const [userData, setUserData] = useState(null);
    const token = localStorage.getItem('token');

    useEffect(()=>{
        async function currentUser(){
            try{
                const res = await axios({
                    headers:{
                        'Authorization': `Bearer ${token}`
                    },
                    method: 'GET',
                    url: 'http://localhost:3001/api/v1/users/me',
                })
                if(res.data.status === 'success'){
                    setUserData(res.data.data.user)
                }
            }catch(err){
                console.log(err.message)
                navigate('/login')
            }
        }
        if (token) {
            currentUser();
        } else {
            navigate('/login');
        }
    }, [token, navigate])


    useEffect(() => {
        if (token) {
            const decodedToken = jwtDecode(token);
            const isExpired = decodedToken.exp * 1000 < Date.now();
            if (isExpired) {
                navigate('/login');
                localStorage.removeItem('token');
            }
        }
    }, [token, navigate]);


}

export default HomePage
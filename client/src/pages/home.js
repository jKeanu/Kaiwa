import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {useNavigate} from 'react-router-dom'
import { jwtDecode } from 'jwt-decode'
import axios from 'axios';

const HomePage = ()=>{
    //Get token from local storage
    const token = localStorage.getItem('token');
    //We use this to navigate from pages to pages
    const navigate = useNavigate()
    //This is where we saved the fetched current logged in user's data
    const [userData, setUserData] = useState(null);
    //The logged in users channels
    const [channels, setChannels] = useState([]);

    useEffect(()=>{
        async function currentUser(){
            try{
                //Fetching logged in user's data
                const res = await axios({
                    headers:{
                        'Authorization': `Bearer ${token}`
                    },
                    method: 'GET',
                    url: 'http://localhost:3001/api/v1/users/me',
                })
                //If the response was success
                if(res.data.status === 'success'){
                    //Save the logged in user's data to a state
                    setUserData(res.data.user)
                    //Since the implementation of channels of friend channel is different to group channel is different
                    //we need to change the structure of the friends array to match group array so we could use sort.
                    const friendChannels = res.data.user.friends.map(friend=>{
                        return{
                            ...friend.channel,
                            channelName: friend.friend.displayName,
                            image: friend.friend.image,
                        }
                    })
                    const allChannels = [...friendChannels, ...res.data.user.groups]
                    const sortedChannels = allChannels.sort((a, b)=> new Date(b.lastMessage)-new Date(a.lastMessage))
                    //Save the sorted channels to a state
                    setChannels(sortedChannels)
                }
            }catch(err){
                console.log(err)
                //remove the token from the local storage if there was an error
                localStorage.removeItem('token')
                //If the fetching of user data responded with an error, return to login page
                navigate('/login')
            }
        }
        if (token) {
            //if there is a token, run the currentUser data fetching function
            currentUser();
        } else {
            //If not, go back to login page
            navigate('/login');

        }
    }, [token, navigate])


    useEffect(() => {
        //Check if the token is not yet expired
        if (token) {
            const decodedToken = jwtDecode(token);
            const isExpired = decodedToken.exp * 1000 < Date.now();
            console.log(decodedToken.exp, Date.now())
            //if expired remove the token, and navigate to login page
            if (isExpired) {
                navigate('/login');
                localStorage.removeItem('token');
            }
        }
    }, [token, navigate]);

    const handleLogout = () =>{
        localStorage.removeItem('token')
        setUserData(null);
        setChannels([]);    
        navigate('/login')
    }

    return(
        <div className='homepage-container'>
            <main>
            <section className='left-section'>
                <div className='channel-links-container'>
                {
                userData
                ?
                <ul>
                    {channels.map(channel=>(
                        <li key={channel.channelNumber}>
                        <NavLink className='register-link' to={`${channel.channelNumber}`}>{channel.channelName}</NavLink>
                        </li>
                    ))}
                </ul>
                :
                <div>Add a friend</div>
                    }

                </div>
                <div>
                    <button onClick={handleLogout}>LogOut</button>
                </div>
            </section>
            </main>
        </div>
    )

}

export default HomePage
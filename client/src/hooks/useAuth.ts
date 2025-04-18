// Auth context or custom hook
import { useEffect, useState } from 'react';
import { isLoggedIn } from '../api/auth';
import axios from 'axios';

function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isError, setIsError] = useState(false) 
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const resStatus = await isLoggedIn()
        // If true, this means that the user is already logged in.
        if (resStatus === 204){
          setIsAuthenticated(true)
        }   
      } catch (err) {
        // Request limit error, if user keeps reloading the auth page.
        if (axios.isAxiosError(err) && err.response && err.response.status === 429){
            setIsError(true)
        }
      }finally{
        setTimeout(()=>{
          setIsLoading(false)
        }, 1500)
      }
    }; 
    checkAuth();
  }, []);

  return {isAuthenticated, isError, isLoading};
}

export default useAuth
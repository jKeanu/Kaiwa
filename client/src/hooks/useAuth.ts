// Auth context or custom hook
import { useEffect, useState } from 'react';
import { isLoggedIn } from '../api/auth';
import axios from 'axios';

function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isError, setIsError] = useState(true) 

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const resData = await isLoggedIn()
        // If true, this means that the user is already logged in.
        if (resData){
            setIsAuthenticated(true)
        }   
      } catch (err) {
        // Request limit error, if user keeps reloading the auth page.
        if (axios.isAxiosError(err) && err.response && err.response.status === 429){
            setIsError(true)
        }
      }
    }; 
    checkAuth();
  }, []);

  return {isAuthenticated, isError};
}

export default useAuth
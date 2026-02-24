import { createContext, useContext, useState, useEffect } from 'react'
import { get_auth, login } from '../api/endpoints';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export const AuthProvider = ({children}) => {

    // Check if user data exists in localStorage to set initial state
    const [auth, setAuth] = useState(false)
    const [authLoading, setAuthLoading] = useState(true)
    const navigate = useNavigate();

    const check_auth = async () => {
        // Only call the API if there's userData in localStorage (user was previously logged in)
        const userData = localStorage.getItem('userData')
        if (!userData) {
            // No previous session, no need to call API
            setAuth(false)
            setAuthLoading(false)
            return
        }

        try {
            await get_auth();
            setAuth(true)
        } catch {
            // Token expired or invalid, clear localStorage
            localStorage.removeItem('userData')
            setAuth(false)
        } finally {
            setAuthLoading(false)
        }
    }

    const auth_login = async (username, password) => {
        const data = await login(username, password)
        if (data.success) {
            setAuth(true)
            const userData = {
                "username":data.user.username,
                "bio":data.user.bio,
                "email":data.user.email,
                "first_name":data.user.first_name,
                "last_name":data.user.last_name,
            }
            localStorage.setItem('userData', JSON.stringify(userData))
            navigate(`/${username}`)
        } else {
            alert('invalid username or password')
        }
    }

    useEffect(() => {
        check_auth()
    }, [])

    return (
        <AuthContext.Provider value={{auth, authLoading, auth_login}}>
            {children}
        </AuthContext.Provider>
    )

}

export const useAuth = () => useContext(AuthContext);
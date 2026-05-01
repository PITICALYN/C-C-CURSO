import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export const AuthProvider = ({ children }) => {
    const [session, setSession] = useState(null)
    const [userProfile, setUserProfile] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchProfile = async (sessionData) => {
            if (sessionData?.user) {
                const { data } = await supabase.from('users').select('*').eq('id', sessionData.user.id).single()
                
                // If it's a student, check if they need a password change
                if (data?.role === 'aluno') {
                    const { data: studentData } = await supabase.from('students').select('requires_password_change').eq('user_id', sessionData.user.id).single()
                    setUserProfile({ ...data, requires_password_change: studentData?.requires_password_change })
                } else {
                    setUserProfile(data)
                }
            } else {
                setUserProfile(null)
            }
        }

        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session)
            fetchProfile(session).then(() => setLoading(false))
        })

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session)
            fetchProfile(session)
        })

        return () => subscription.unsubscribe()
    }, [])

    return (
        <AuthContext.Provider value={{ session, userProfile, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)

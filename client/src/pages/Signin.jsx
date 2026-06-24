import React, {useState} from 'react'
import { Link } from 'react-router-dom'
import { UserAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

const Signin = () => {

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    
    const { session, signInUser } = UserAuth();
    const navigate = useNavigate();
    console.log("Session in Signin component:", session);

    const handleSignin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const result = await signInUser(email, password);
            if (result?.success) {
                console.log("Sign-in successful:asdasd", result);
                console.log("token thing:", result.data.session.access_token);
                await api.post(
                    "/auth/sync",
                {},
                {
                    headers: {
                    Authorization: `Bearer ${result.data.session.access_token}`,
                    },
                }
                );

                navigate('/dashboard');
            } else {
                setError(result?.error?.message || 'Unable to sign in');
            }
        } catch (err) {
            setError(err?.message || 'An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    }


  return (
    <div>
        <form className="max-w-md m-auto pt-24" onSubmit={handleSignin}>
            <h2 className="font-bold pb-2">Sign in</h2>
            <p>
                Don' have an account? <Link to="/signup">Sign up</Link>
            </p>
            <div className="flex flex-col py-4">
                <input 
                    onChange={(e) => setEmail(e.target.value)} 
                    className="p-3 mt-6" 
                    type="email" 
                    placeholder="Email"/>
                <input 
                    onChange={(e) => setPassword(e.target.value)} 
                    className="p-3 mt-6" 
                    type="password" 
                    placeholder="Password"/>
                <button className="mt-6 w-full" type="submit" disabled={loading}> 
                    Sign in
                </button>
                {error && <p className="text-red-600 text-center pt-4">{error}</p>}
            </div>
        </form>
    </div>
  )
}

export default Signin
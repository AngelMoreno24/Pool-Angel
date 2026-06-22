import React, {useState} from 'react'
import { Link } from 'react-router-dom'
import { UserAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Signup = () => {

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    
    const { session, signUpNewUser } = UserAuth();
    const navigate = useNavigate();
    console.log("Session in Signup component:", session);

    const handleSignup = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const result = await signUpNewUser(email, password);
            if (result?.success) {
                navigate('/dashboard');
            } else {
                setError(result?.error?.message || 'Unable to sign up');
            }
        } catch (err) {
            setError(err?.message || 'An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    }


  return (
    <div>
        <form className="max-w-md m-auto pt-24" onSubmit={handleSignup}>
            <h2 className="font-bold pb-2">Signup</h2>
            <p>
                Already have an account? <Link to="/signin">Sign in</Link>
            </p>
            <div className="flex flex-col py-4">
                <input 
                    onChange={(e) => setEmail(e.target.value)} 
                    className="p-3 mt-6" 
                    type="email" 
                    placeholder="Email" />
                <input 
                    onChange={(e) => setPassword(e.target.value)} 
                    className="p-3 mt-6 " 
                    type="password" 
                    placeholder="Password" />
                <button className="mt-6 w-full" type="submit" disabled={loading}> 
                    Sign up
                </button>
                {error && <p className="text-red-600 text-center pt-4">{error}</p>}
            </div>
        </form>
    </div>
  )
}

export default Signup
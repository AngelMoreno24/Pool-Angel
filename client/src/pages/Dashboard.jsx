import React from 'react'
import { UserAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {

  const { session, signOut } = UserAuth();
  const navigate = useNavigate();
  
  console.log("Session in Dashboard component:", session);

  const handleSignOut = async (e) => {
    e.preventDefault();
    try {
      await signOut();
      navigate('/signin');
    } catch (err){
      console.error("Error signing out:", err);
    }
  }


  return (
    <div>
      <h1>Dashboard</h1>
      <h2>Welcome, {session?.user?.email}</h2>
      <div>
        <p className="hover:cursor-pointer border inline-block px-4 py-3 mt-4" onClick={handleSignOut}>
          Sign out
        </p>
      </div>
    </div>
  )
}

export default Dashboard
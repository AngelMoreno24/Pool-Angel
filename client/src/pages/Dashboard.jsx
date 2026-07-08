//dashboard.jsx
import React, { useState, useEffect} from 'react'
import { UserAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {getCustomers} from '../services/customerService';

const Dashboard = () => {

  const { session, signOut } = UserAuth();
  const [customers, setCustomers] = useState([]);

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

  
  useEffect(() => {

    const fetchCustomers = async () => {
      try {
        const response = await getCustomers();
        setCustomers(response);
        console.log("Fetched customers:", response);
      } catch (error) {
        console.error("Error fetching customers:", error);
      }
    };

    fetchCustomers();
  },[session]);


  return (
    <div>
      <h1>Dashboard</h1>
      <h2>Welcome, {session?.user?.email}</h2>
      <div>
        <p class="text-white">total customers = {customers.length}</p>
        <p class="text-white">total properties = {}</p>
        <p class="text-white">total pools = {}</p>
      </div>
      <div>
        <p className="hover:cursor-pointer border inline-block px-4 py-3 mt-4" onClick={handleSignOut}>
          Sign out
        </p>
      </div>
    </div>
  )
}

export default Dashboard
//dashboard.jsx
import React, { useState, useEffect} from 'react'
import { UserAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {getCustomers} from '../services/customerService';
import {getProperties} from '../services/propertyService';
const Dashboard = () => {

  const { session, signOut } = UserAuth();
  const [customers, setCustomers] = useState([]);
  const [properties, setProperties] = useState([]);

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

    const fetchProperties = async () => {
      try {
        const response = await getProperties(session?.user?.id);
        setProperties(response);
        console.log("Fetched properties:", response);
      } catch (error) {
        console.error("Error fetching properties:", error);
      }
    };

    fetchCustomers();
    fetchProperties();
  },[session]);


  return (
    <div>
      <h1>Dashboard</h1>
      <h2>Welcome, {session?.user?.email}</h2>
      <div>
        <p class="text-white">total customers = {customers.length}</p>
        <p class="text-white">total properties = {properties.length}</p>
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
import React, { useState, useEffect} from 'react'
import { UserAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {getCustomers, createCustomer} from '../services/customerService';
const Customer = () => {

  
    const { session, signOut } = UserAuth();
    const [customers, setCustomers] = useState([]);
    const [properties, setProperties] = useState([]);
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");

    useEffect(() => {
        const fetchData = async () => {
          try {
            const response = await getCustomers();
            setCustomers(response);
            console.log("Fetched customers:", response);
          } catch (error) {
            console.error("Error fetching customers:", error);
          }
        }
        fetchData();
    }, []);
  return (
    <>
    <div>Customer</div>
    <div>
      <h2>Customers</h2>
      <ul>
        {customers.map((customer) => (
          <li key={customer.id}>{customer.firstName}</li>
        ))}
      </ul>
    </div>
    <div>
      <h2>Create Customer</h2>
      <div className=" w-40 flex flex-col gap-2 ml-auto mr-auto">
        <input type="text" value={firstName} onChange={(e)=> setFirstName(e.target.value)} placeholder="Customer first Name"  />
        <input type="text" value={lastName} onChange={(e)=> setLastName(e.target.value)} placeholder="Customer last Name" />
        <input type="text" value={email} onChange={(e)=> setEmail(e.target.value)} placeholder="Customer Email" />
        <input type="text" value={phone} onChange={(e)=> setPhone(e.target.value)} placeholder="Customer Phone" />

      </div>
      <button class="bg-" onClick={async () => {
        const newCustomer = { firstName, lastName, email, phone };
        try {
          const createdCustomer = await createCustomer(newCustomer);
          setCustomers([...customers, createdCustomer]);
        } catch (error) {
          console.error("Error creating customer:", error);
        }
      }}>Create Customer</button>
    </div>
    </>
  )
}

export default Customer
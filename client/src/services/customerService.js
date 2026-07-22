import api from "../api/axios";

export const getCustomers = async () => {
  const response = await api.get("/customers/getAll");
  return response.data;
};

export const createCustomer = async (customer) => {
  const response = await api.post("/customers/create", customer);
  return response.data;
};


export const getCustomerById = async (customerId) => {
  const response = await api.get(`/customers/${customerId}`);
  return response.data;
};

export const updateCustomer = async (customerId, customer) => {
  const response = await api.put(`/customers/update/${customerId}`, customer);
  return response.data;
};


export const deleteCustomer = async (customerId) => {
  const response = await api.delete(`/customers/delete/${customerId}`);
  return response.data;
};
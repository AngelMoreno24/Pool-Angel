import api from "../api/axios";

export const getCustomers = async () => {
  const response = await api.get("/customers/getAll");
  return response.data;
};

export const createCustomer = async (customer) => {
  const response = await api.post("/customers/create", customer);
  return response.data;
};


export const getOneCustomer = async (customerId) => {
  const response = await api.post(`/customers/create/${customerId}`);
  return response.data;
};

export const updateCustomer = async (customerId) => {
  const response = await api.post(`/customers/update/create/${customerId}`, customer);
  return response.data;
};


export const deleteCustomer = async (customerId) => {
  const response = await api.post(`/customers/delete/create/${customerId}`);
  return response.data;
};
import api from "../api/axios";

export const getProperties = async (customerId) => {
  const response = await api.get(`/properties/customer/${customerId}`);
  return response.data;
};

export const createProperty = async (customer) => {
  const response = await api.post("/properties/", customer);
  return response.data;
};

export const getPropertyById = async (customerId) => {
  const response = await api.get(`/properties/${customerId}`);
  return response.data;
};

export const getPropertiesByCustomer = async (customerId) => {
  const response = await api.get(`/properties/customer/${customerId}`);
  return response.data;
};

export const updateProperty = async (customerId, customer) => {
  const response = await api.put(`/properties/${customerId}`, customer);
  return response.data;
};


export const deleteProperty = async (customerId) => {
  const response = await api.delete(`/properties/${customerId}`);
  return response.data;
};
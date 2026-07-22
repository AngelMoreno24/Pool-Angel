import api from "../api/axios";

export const getProperties = async (customerId) => {
  const response = await api.get(`/properties/customer/${customerId}`);
  return response.data;
};

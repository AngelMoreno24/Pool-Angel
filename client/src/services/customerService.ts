import api from "../api/axios";

export const getCustomers = async () => {
  const response = await api.get("/customers");
  return response.data;
};

export const createCustomer = async (customer: {
  name: string;
  email: string;
}) => {
  const response = await api.post("/customers", customer);
  return response.data;
};
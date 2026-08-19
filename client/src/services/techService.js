import api from "../api/axios";

export const createTech = async (data) => {
  const response = await api.post("/auth/tech", data);
  return response.data;
};

export const getTechs = async () => {
  const response = await api.get("/auth/tech");
  return response.data;
};

export const getTech = async (id) => {
  const response = await api.get(`/auth/tech/${id}`);
  return response.data;
};

export const updateTech = async (id, data) => {
  const response = await api.put(`/auth/tech/${id}`, data);
  return response.data;
};

export const deleteTech = async (id) => {
  const response = await api.delete(`/auth/tech/${id}`);
  return response.data;
};
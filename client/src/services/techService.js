import api from "../api/axios";

export const createTech = async (data) => {
  const response = await api.post("/auth/tech", data);
  return response.data;
};

export const getTechs = async () => {
  const response = await api.get("/auth/tech");
  return response.data;
};
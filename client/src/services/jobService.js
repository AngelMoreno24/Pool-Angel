import api from "../api/axios";

export const getjob = async () => {
  const response = await api.get("/jobs/getAll");
  return response.data;
};

export const createjob = async (data) => {
  const response = await api.post("/jobs/create", data);
  return response.data;
};

export const getjobById = async (id) => {
  const response = await api.get(`/jobs/${id}`);
  return response.data;
};

export const getjobByTech = async (id) => {
  const response = await api.get(`/jobs/getByTech/${id}`);
  return response.data;
};

export const getjobForRoute = async (id) => {
  const response = await api.get(`/jobs/getForRoute/${id}`);
  return response.data;
};

export const updatejob = async (id, data) => {
  const response = await api.put(`/jobs/update/${id}`, data);
  return response.data;
};


export const deletejob = async (id) => {
  const response = await api.delete(`/jobs/delete/${id}`);
  return response.data;
};
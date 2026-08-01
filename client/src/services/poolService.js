import api from "../api/axios";

export const createPool = async (pool) => {
  const response = await api.post("/pools/", pool);
  return response.data;
};

export const getPoolByProperty = async (id) => {
  const response = await api.get(`/pools/property/${id}`);
  return response.data;
};

export const updatePool = async (id, pool) => {
  const response = await api.put(`/pools/${id}`, pool);
  return response.data;
};


export const deletePool = async (id) => {
  const response = await api.delete(`/pools/${id}`);
  return response.data;
};

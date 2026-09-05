import api from "../api/axios";

export const getVisits = async () => {
  const response = await api.get("/visits/getAll");
  return response.data;
};

export const createVisit = async (data) => {
  const response = await api.post("/visits/create", data);
  return response.data;
};


export const getVisitById = async (id) => {
  const response = await api.get(`/visits/${id}`);
  return response.data;
};

export const updateVisit = async (id, data) => {
  const response = await api.put(`/visits/update/${id}`, data);
  return response.data;
};


export const deleteVisit = async (id) => {
  const response = await api.delete(`/visits/delete/${id}`);
  return response.data;
};

export const checkInVisit = async (id) => {
  const response = await api.post(`/visits/${id}/check-in`);
  return response.data;
};

export const completeVisit = async (id, data) => {
  const response = await api.post(`/visits/${id}/complete`, data);
  return response.data;
};

export const skipVisit = async (id, reason) => {
  const response = await api.post(`/visits/${id}/skip`, { reason });
  return response.data;
};

export const getVisitsByProperty = async (propertyId) => {
  const response = await api.get(`/visits/property/${propertyId}`);
  return response.data;
};
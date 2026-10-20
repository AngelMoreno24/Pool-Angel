import api from "../api/axios";

export const getNotes = async () => {
  const response = await api.get("/notes/getAll");
  return response.data;
};

export const createNote = async (note) => {
  const response = await api.post("/notes/create", note);
  return response.data;
};

export const updateNote = async (id, note) => {
  const response = await api.put(`/notes/update/${id}`, note);
  return response.data;
};

export const deleteNote = async (id) => {
  const response = await api.delete(`/notes/delete/${id}`);
  return response.data;
};
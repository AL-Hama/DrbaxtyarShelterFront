import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

const getToken = () => localStorage.getItem("token");

const authHeaders = () => ({
  headers: {
    Authorization: `Bearer ${getToken()}`,
  },
});

export const getTreatments = () =>
  axios.get(`${API_URL}/treatments`, authHeaders());

export const getTreatment = (id) =>
  axios.get(`${API_URL}/treatments/${id}`, authHeaders());

export const createTreatment = (data) =>
  axios.post(`${API_URL}/treatments`, data, authHeaders());

export const updateTreatment = (id, data) =>
  axios.put(`${API_URL}/treatments/${id}`, data, authHeaders());

export const deleteTreatment = (id) =>
  axios.delete(`${API_URL}/treatments/${id}`, authHeaders());
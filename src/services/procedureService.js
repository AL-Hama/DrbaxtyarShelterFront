import api from "./api";

export const getProcedures = () =>
  api.get("/procedures");

export const getProcedure = (id) =>
  api.get(`/procedures/${id}`);

export const createProcedure = (data) =>
  api.post("/procedures", data);

export const deleteProcedure = (id) =>
  api.delete(`/procedures/${id}`);
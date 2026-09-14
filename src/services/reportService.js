import api from "./api";

export const getReport = async (from, to) => {
  const res = await api.get("/reports", {
    params: { from, to },
  });

  return res.data;
};
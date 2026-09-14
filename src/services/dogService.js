import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

const authHeader = () => ({
    headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
});

export const getDogs = async () => {
    const res = await axios.get(
        `${API_URL}/dogs`,
        authHeader()
    );

    return res.data;
};

export const createDog = async (dog) => {

    const res = await axios.post(
        `${API_URL}/dogs`,
        dog,
        authHeader()
    );

    return res.data;
};

export const updateDog = async (id, dog) => {

    const res = await axios.put(
        `${API_URL}/dogs/${id}`,
        dog,
        authHeader()
    );

    return res.data;
};

export const deleteDog = async (id) => {

    const res = await axios.delete(
        `${API_URL}/dogs/${id}`,
        authHeader()
    );

    return res.data;
};
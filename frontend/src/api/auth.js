import axios from "axios";

const API = axios.create({
    baseURL: "http://localhost:5000/api",
});

export const signupUser = (userData) => {
    return API.post("/auth/signup", userData);
};

export const loginUser = (userData) => {
    return API.post("/auth/login", userData);
};

export const googleAuthUser = (userData) => {
    return API.post("/auth/google", userData);
};
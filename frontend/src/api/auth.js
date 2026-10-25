import axios from "axios";
import { API_BASE_URL } from "../config/api";

const API = axios.create({
    baseURL: API_BASE_URL,
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

export const forgotPasswordUser = (data) => {
    return API.post("/auth/forgot-password", data);
};

export const resetPasswordUser = (data) => {
    return API.post("/auth/reset-password", data);
};
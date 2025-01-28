import axiosInstance from "./axiosInstance";

export const login = async (email, password) => {
  return axiosInstance.post("/auth/login", { email, password });
};

export const register = async (name, email, password) => {
  return axiosInstance.post("/users/register", { name, email, password });
};

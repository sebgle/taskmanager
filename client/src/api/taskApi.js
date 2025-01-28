import axiosInstance from "./axiosInstance";

export const fetchTasks = async () => {
  return axiosInstance.get("/task");
};

export const createTask = async (task) => {
  return axiosInstance.post("/task", task);
};

export const updateTask = async (id, task) => {
  return axiosInstance.put(`/task/${id}`, task);
};

export const deleteTask = async (id) => {
  return axiosInstance.delete(`/task/${id}`);
};

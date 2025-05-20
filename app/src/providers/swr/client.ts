import axios from "axios";

export const axiosClient = axios.create({
  baseURL: "http://192.168.15.133:3000",
  headers: {
    "Content-Type": "application/json",
  },
});

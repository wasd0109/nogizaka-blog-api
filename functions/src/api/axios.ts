import * as axios from "axios";

const BASE_URL = "https://blog.nogizaka46.com";

export const api = axios.default.create({
  baseURL: BASE_URL,
});

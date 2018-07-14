import axios from "axios";
import devConfig from "../Config/development.json";

export function getApi(link) {
  return axios.get(`${devConfig.API_HOST}${link}`);
}

export function postApi(link, data) {
  return axios.post(`${devConfig.API_HOST}${link}`, data);
}

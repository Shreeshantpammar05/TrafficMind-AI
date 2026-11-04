import { io } from "socket.io-client";
import { API_BASE } from "./config/api.js";

const socket = io(
  API_BASE
);

export default socket;
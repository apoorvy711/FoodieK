import React, { createContext, useContext } from "react";
import { socket } from "../services/socket";

const SocketContext = createContext();

const SocketProvider = ({ children }) => {
  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
};

const useSocket = () => {
  return useContext(SocketContext);
};

export { SocketProvider, useSocket };

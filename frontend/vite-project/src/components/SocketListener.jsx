import { useEffect } from "react";
import toast from "react-hot-toast";

import { useSocket } from "../context/SocketContext";

function SocketListener() {
  const socket = useSocket();

  useEffect(() => {
    if (!socket) return;

    if (!socket.connected) {
      socket.connect();
    }

    const handleConnect = () => {
      console.log("✅ Socket Connected");
      console.log("Socket ID:", socket.id);
    };

    const handleConnectError = (error) => {
      console.error("❌ Socket Connection Failed");
      console.error(error.message);
    };

    const handleDisconnect = (reason) => {
      console.log("❌ Socket Disconnected");
      console.log("Reason:", reason);
    };

    // ===========================
    // Notifications
    // ===========================
    const handleNotification = (data) => {
      console.log("📩 Notification Received");
      console.log(data);

      toast.success(data.message);

      if (data.type === "ORDER" || data.type === "ORDER_STATUS_UPDATED") {
        window.dispatchEvent(
          new CustomEvent("order-status-updated", {
            detail: data,
          }),
        );
      }
    };

    // ===========================
    // Live Likes
    // ===========================
    const handleFoodLiked = (data) => {
      console.log("❤️ Food Like Updated");
      console.log(data);

      window.dispatchEvent(
        new CustomEvent("food-liked", {
          detail: data,
        }),
      );
    };

    const handleCommentAdded = (data) => {
      console.log("💬 Comment Added");
      console.log(data);

      window.dispatchEvent(
        new CustomEvent("comment-added", {
          detail: data,
        }),
      );
    };
    socket.on("comment-added", handleCommentAdded);
    socket.on("connect", handleConnect);
    socket.on("connect_error", handleConnectError);
    socket.on("disconnect", handleDisconnect);
    socket.on("notification", handleNotification);
    socket.on("food-liked", handleFoodLiked);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("connect_error", handleConnectError);
      socket.off("disconnect", handleDisconnect);
      socket.off("notification", handleNotification);
      socket.off("food-liked", handleFoodLiked);
      socket.off("comment-added", handleCommentAdded);
    };
  }, [socket]);

  return null;
}

export default SocketListener;

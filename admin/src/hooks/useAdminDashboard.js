import { useCallback, useEffect, useState } from "react";
import api from "../api/api";
import { DASHBOARD_REFRESH_EVENT } from "../utils/adminEvents";

export function useAdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState(null);
  const [recentRequests, setRecentRequests] = useState([]);

  const loadDashboard = useCallback(
    async ({ preserveLoading = false } = {}) => {
      if (!preserveLoading) {
        setLoading(true);
      }

      setError("");

      try {
        const response = await api.get("/admin/dashboard");
        setStats(response.data?.stats || null);
        setRecentRequests(response.data?.recentRequests || []);
      } catch (requestError) {
        setError(
          requestError?.response?.data?.message ||
            "Could not load dashboard summary.",
        );
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      loadDashboard();
    }, 0);

    return () => clearTimeout(timer);
  }, [loadDashboard]);

  const refreshDashboard = useCallback(() => {
    loadDashboard({ preserveLoading: true });
  }, [loadDashboard]);

  useEffect(() => {
    const onRefresh = () => {
      refreshDashboard();
    };

    window.addEventListener(DASHBOARD_REFRESH_EVENT, onRefresh);

    return () => {
      window.removeEventListener(DASHBOARD_REFRESH_EVENT, onRefresh);
    };
  }, [refreshDashboard]);

  return {
    loading,
    error,
    stats,
    recentRequests,
    refreshDashboard,
  };
}

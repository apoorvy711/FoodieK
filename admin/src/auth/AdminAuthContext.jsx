/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import toast from "react-hot-toast";
import api, { setApiUnauthorizedHandler } from "../api/api";

const AdminAuthContext = createContext(null);

function guestState() {
  return {
    status: "guest",
    admin: null,
  };
}

function isAdminUser(user) {
  return Boolean(user && user.role === "admin");
}

async function fetchCurrentAdmin() {
  const response = await api.get("/admin/me", {
    __skipAuthHandler: true,
  });

  return response.data?.admin;
}

export function AdminAuthProvider({ children }) {
  const [authState, setAuthState] = useState({
    status: "loading",
    admin: null,
  });
  const sessionToastShownRef = useRef(false);

  const setAdmin = useCallback((user) => {
    setAuthState({
      status: "authenticated",
      admin: user,
    });
  }, []);

  const setGuest = useCallback(() => {
    setAuthState(guestState());
  }, []);

  const refreshAuth = useCallback(async () => {
    setAuthState((current) => ({
      ...current,
      status: "loading",
    }));

    try {
      const meUser = await fetchCurrentAdmin();

      if (!isAdminUser(meUser)) {
        await api.get("/auth/user/logout", {
          __skipAuthHandler: true,
          __suppressAuthToast: true,
        });
        setGuest();
        return;
      }

      setAdmin(meUser);
      sessionToastShownRef.current = false;
    } catch {
      setGuest();
    }
  }, [setAdmin, setGuest]);

  useEffect(() => {
    const timer = setTimeout(() => {
      refreshAuth();
    }, 0);

    return () => {
      clearTimeout(timer);
    };
  }, [refreshAuth]);

  useEffect(() => {
    const handler = (error) => {
      if (authState.status !== "authenticated") {
        return;
      }

      setGuest();

      if (
        !error?.config?.__suppressAuthToast &&
        !sessionToastShownRef.current
      ) {
        sessionToastShownRef.current = true;
        toast.error("Admin session expired. Please login again.");
      }
    };

    setApiUnauthorizedHandler(handler);

    return () => {
      setApiUnauthorizedHandler(null);
    };
  }, [authState.status, setGuest]);

  const login = useCallback(
    async ({ email, password }) => {
      await api.post(
        "/auth/user/login",
        {
          email,
          password,
        },
        {
          __skipAuthHandler: true,
        },
      );

      const meUser = await fetchCurrentAdmin();

      if (!isAdminUser(meUser)) {
        await api.get("/auth/user/logout", {
          __skipAuthHandler: true,
          __suppressAuthToast: true,
        });
        setGuest();
        throw new Error("This account does not have admin access.");
      }

      setAdmin(meUser);
      sessionToastShownRef.current = false;

      return meUser;
    },
    [setAdmin, setGuest],
  );

  const logout = useCallback(async () => {
    try {
      await api.get("/auth/user/logout", {
        __skipAuthHandler: true,
      });
    } catch {
      // Ignore network errors on logout.
    }

    setGuest();
  }, [setGuest]);

  const value = useMemo(
    () => ({
      ...authState,
      isAuthenticated: authState.status === "authenticated",
      authResolved: authState.status !== "loading",
      refreshAuth,
      login,
      logout,
    }),
    [authState, login, logout, refreshAuth],
  );

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);

  if (!context) {
    throw new Error("useAdminAuth must be used within AdminAuthProvider");
  }

  return context;
}

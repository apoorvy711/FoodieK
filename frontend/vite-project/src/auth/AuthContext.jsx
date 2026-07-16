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

const AuthContext = createContext(null);
const AUTH_MARKER_KEY = "foodiek-had-auth";

function normalizeUserRole(user) {
  if (user?.role === "admin") {
    return "admin";
  }

  return "user";
}

function guestState() {
  return {
    status: "guest",
    role: "guest",
    user: null,
    foodPartner: null,
  };
}

export function AuthProvider({ children }) {
  const [authState, setAuthState] = useState({
    status: "loading",
    role: "guest",
    user: null,
    foodPartner: null,
  });
  const sessionToastShownRef = useRef(false);

  const setAuthenticatedUser = useCallback((user) => {
    window.sessionStorage.setItem(AUTH_MARKER_KEY, "1");
    setAuthState({
      status: "authenticated",
      role: normalizeUserRole(user),
      user,
      foodPartner: null,
    });
  }, []);

  const setAuthenticatedFoodPartner = useCallback((foodPartner) => {
    window.sessionStorage.setItem(AUTH_MARKER_KEY, "1");
    setAuthState({
      status: "authenticated",
      role: "food_partner",
      user: null,
      foodPartner,
    });
  }, []);

  const setGuest = useCallback(() => {
    setAuthState(guestState());
  }, []);

  const refreshAuth = useCallback(async () => {
    setAuthState((current) => ({ ...current, status: "loading" }));

    try {
      const userResponse = await api.get("/auth/user/me", {
        __skipAuthHandler: true,
      });

      setAuthenticatedUser(userResponse.data.user);
      sessionToastShownRef.current = false;
      return;
    } catch (error) {
      // continue to partner check
    }

    try {
      const partnerResponse = await api.get("/auth/food-partner/me", {
        __skipAuthHandler: true,
      });

      setAuthenticatedFoodPartner(partnerResponse.data.foodPartner);
      sessionToastShownRef.current = false;
      return;
    } catch (error) {
      setGuest();
    }
  }, [setAuthenticatedFoodPartner, setAuthenticatedUser, setGuest]);

  useEffect(() => {
    refreshAuth();
  }, [refreshAuth]);

  useEffect(() => {
    const handler = (error) => {
      const hadAuthenticatedBefore =
        window.sessionStorage.getItem(AUTH_MARKER_KEY) === "1";
      const currentlyAuthenticated = authState.role !== "guest";

      if (!hadAuthenticatedBefore || !currentlyAuthenticated) {
        return;
      }

      setGuest();

      if (
        !error?.config?.__suppressAuthToast &&
        !sessionToastShownRef.current
      ) {
        sessionToastShownRef.current = true;
        toast.error("Your session has expired. Please login again.");
      }
    };

    setApiUnauthorizedHandler(handler);

    return () => {
      setApiUnauthorizedHandler(null);
    };
  }, [authState.role, setGuest]);

  const logoutCurrent = useCallback(async () => {
    try {
      if (authState.role === "food_partner") {
        await api.get("/auth/food-partner/logout", { __skipAuthHandler: true });
      } else {
        await api.get("/auth/user/logout", { __skipAuthHandler: true });
      }
    } catch (error) {
      // Ignore logout network errors and clear local auth state anyway.
    }

    setGuest();
  }, [authState.role, setGuest]);

  const value = useMemo(
    () => ({
      ...authState,
      authResolved: authState.status !== "loading",
      isGuest: authState.role === "guest",
      isUser: authState.role === "user" || authState.role === "admin",
      isFoodPartner: authState.role === "food_partner",
      isAdmin: authState.role === "admin",
      refreshAuth,
      logoutCurrent,
    }),
    [authState, logoutCurrent, refreshAuth],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}

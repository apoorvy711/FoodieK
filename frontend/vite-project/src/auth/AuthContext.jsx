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
    restaurantVerification: null,
    verificationLoading: false,
  };
}

function defaultVerificationState() {
  return {
    hasRequest: false,
    status: "not_submitted",
    message: "",
    request: null,
    isRestaurantFeatureLocked: true,
  };
}

function normalizeVerificationResponse(data) {
  if (!data || data.hasRequest === false) {
    return defaultVerificationState();
  }

  const status = data.status || "unknown";

  return {
    hasRequest: Boolean(data.hasRequest),
    status,
    message: data.message || "",
    request: data.request || null,
    isRestaurantFeatureLocked:
      typeof data.isRestaurantFeatureLocked === "boolean"
        ? data.isRestaurantFeatureLocked
        : status !== "approved",
  };
}

export function AuthProvider({ children }) {
  const [authState, setAuthState] = useState({
    status: "loading",
    role: "guest",
    user: null,
    foodPartner: null,
    restaurantVerification: null,
    verificationLoading: false,
  });
  const sessionToastShownRef = useRef(false);

  const setAuthenticatedUser = useCallback((user) => {
    window.sessionStorage.setItem(AUTH_MARKER_KEY, "1");
    setAuthState({
      status: "authenticated",
      role: normalizeUserRole(user),
      user,
      foodPartner: null,
      restaurantVerification: null,
      verificationLoading: false,
    });
  }, []);

  const setAuthenticatedFoodPartner = useCallback(
    (foodPartner, verification) => {
      window.sessionStorage.setItem(AUTH_MARKER_KEY, "1");
      setAuthState({
        status: "authenticated",
        role: "food_partner",
        user: null,
        foodPartner,
        restaurantVerification: verification,
        verificationLoading: false,
      });
    },
    [],
  );

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
    } catch {
      // continue to partner check
    }

    try {
      const partnerResponse = await api.get("/auth/food-partner/me", {
        __skipAuthHandler: true,
      });

      let verification = defaultVerificationState();

      try {
        const verificationResponse = await api.get(
          "/restaurant-request/status",
          {
            __skipAuthHandler: true,
            __suppressAuthToast: true,
          },
        );

        verification = normalizeVerificationResponse(verificationResponse.data);
      } catch {
        verification = {
          ...defaultVerificationState(),
          status: "unknown",
          message: "Could not fetch verification status",
          isRestaurantFeatureLocked: true,
        };
      }

      setAuthenticatedFoodPartner(
        partnerResponse.data.foodPartner,
        verification,
      );
      sessionToastShownRef.current = false;
      return;
    } catch {
      setGuest();
    }
  }, [setAuthenticatedFoodPartner, setAuthenticatedUser, setGuest]);

  const refreshRestaurantVerification = useCallback(async () => {
    if (authState.role !== "food_partner") {
      return null;
    }

    setAuthState((current) => {
      if (current.role !== "food_partner") {
        return current;
      }

      return {
        ...current,
        verificationLoading: true,
      };
    });

    try {
      const response = await api.get("/restaurant-request/status", {
        __skipAuthHandler: true,
        __suppressAuthToast: true,
      });
      const normalized = normalizeVerificationResponse(response.data);

      setAuthState((current) => {
        if (current.role !== "food_partner") {
          return current;
        }

        return {
          ...current,
          restaurantVerification: normalized,
          verificationLoading: false,
        };
      });

      return normalized;
    } catch {
      const fallback = {
        ...defaultVerificationState(),
        status: "unknown",
        message: "Could not fetch verification status",
        isRestaurantFeatureLocked: true,
      };

      setAuthState((current) => {
        if (current.role !== "food_partner") {
          return current;
        }

        return {
          ...current,
          restaurantVerification: fallback,
          verificationLoading: false,
        };
      });

      return fallback;
    }
  }, [authState.role]);

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
    } catch {
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
      restaurantVerification:
        authState.role === "food_partner"
          ? authState.restaurantVerification || defaultVerificationState()
          : null,
      isRestaurantFeatureLocked:
        authState.role === "food_partner"
          ? (authState.restaurantVerification || defaultVerificationState())
              .isRestaurantFeatureLocked
          : false,
      refreshAuth,
      refreshRestaurantVerification,
      logoutCurrent,
    }),
    [authState, logoutCurrent, refreshAuth, refreshRestaurantVerification],
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

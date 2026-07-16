import { useCallback, useMemo, useState } from "react";
import { useAuth } from "../auth/AuthContext";

export function useAuthRequiredModal() {
  const auth = useAuth();
  const [modalConfig, setModalConfig] = useState(null);

  const closeAuthModal = useCallback(() => {
    setModalConfig(null);
  }, []);

  const requireCustomerAuth = useCallback(
    ({ title, description } = {}) => {
      if (auth.isUser) {
        return true;
      }

      if (auth.isFoodPartner) {
        setModalConfig({
          title: "Customer account required",
          description:
            "This action requires a customer account. Please login with a user account to continue.",
          primaryLabel: "Login as User",
          primaryTo: "/user/login",
          secondaryLabel: "Create User Account",
          secondaryTo: "/user/register",
        });
        return false;
      }

      setModalConfig({
        title: title || "Login to continue",
        description:
          description ||
          "You need a FoodieK customer account to complete this action.",
        primaryLabel: "Login",
        primaryTo: "/user/login",
        secondaryLabel: "Create Account",
        secondaryTo: "/user/register",
      });
      return false;
    },
    [auth.isFoodPartner, auth.isUser],
  );

  const requireFoodPartnerAuth = useCallback(
    ({ title, description } = {}) => {
      if (auth.isFoodPartner) {
        return true;
      }

      if (auth.isUser) {
        setModalConfig({
          title: "Food Partner account required",
          description:
            "This action is only available to restaurant partners. Please login with a Food Partner account.",
          primaryLabel: "Food Partner Login",
          primaryTo: "/food-partner/login",
          secondaryLabel: "Register Restaurant",
          secondaryTo: "/food-partner/register",
        });
        return false;
      }

      setModalConfig({
        title: title || "Restaurant partner access required",
        description:
          description ||
          "Login to your Food Partner account to manage your restaurant and dishes.",
        primaryLabel: "Food Partner Login",
        primaryTo: "/food-partner/login",
        secondaryLabel: "Register Restaurant",
        secondaryTo: "/food-partner/register",
      });
      return false;
    },
    [auth.isFoodPartner, auth.isUser],
  );

  return useMemo(
    () => ({
      requireCustomerAuth,
      requireFoodPartnerAuth,
      modalConfig,
      closeAuthModal,
    }),
    [closeAuthModal, modalConfig, requireCustomerAuth, requireFoodPartnerAuth],
  );
}

export const DASHBOARD_REFRESH_EVENT = "admin:dashboard-refresh";

export function emitDashboardRefresh() {
  window.dispatchEvent(new CustomEvent(DASHBOARD_REFRESH_EVENT));
}

import { useAdminAuth } from "../auth/AdminAuthContext";

const Profile = () => {
  const auth = useAdminAuth();

  return (
    <section className="admin-page">
      <header className="admin-page-header">
        <h2>Profile</h2>
      </header>

      <div className="admin-detail-card">
        <p>
          <strong>Name:</strong> {auth.admin?.fullName || "Admin"}
        </p>
        <p>
          <strong>Email:</strong> {auth.admin?.email}
        </p>
        <p>
          <strong>Role:</strong> {auth.admin?.role}
        </p>
        <p>
          <strong>Created At:</strong>{" "}
          {auth.admin?.createdAt
            ? new Date(auth.admin.createdAt).toLocaleString()
            : "-"}
        </p>
        <p>
          <strong>Last Login:</strong>{" "}
          {auth.admin?.lastLogin
            ? new Date(auth.admin.lastLogin).toLocaleString()
            : "-"}
        </p>
      </div>
    </section>
  );
};

export default Profile;

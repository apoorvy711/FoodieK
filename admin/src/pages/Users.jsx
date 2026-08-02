import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../api/api";
import EmptyState from "../components/common/EmptyState";
import TableSkeleton from "../components/common/TableSkeleton";

const Users = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const loadUsers = useCallback(async ({ preserveLoading = false } = {}) => {
    if (preserveLoading) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const response = await api.get("/admin/users");
      setUsers(response.data?.users || []);
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message || "Could not load users.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadUsers();
    }, 0);

    return () => clearTimeout(timer);
  }, [loadUsers]);

  const filteredUsers = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    if (!normalizedSearch) {
      return users;
    }

    return users.filter((user) => {
      const name = user.fullName?.toLowerCase() || "";
      const email = user.email?.toLowerCase() || "";

      return (
        name.includes(normalizedSearch) || email.includes(normalizedSearch)
      );
    });
  }, [searchTerm, users]);

  if (loading) {
    return (
      <section className="admin-page">
        <header className="admin-page-header">
          <h2>Users</h2>
        </header>
        <div className="admin-table-card">
          <TableSkeleton rows={8} columns={4} />
        </div>
      </section>
    );
  }

  if (error) {
    return <EmptyState title="Unable to load users" description={error} />;
  }

  return (
    <section className="admin-page">
      <header className="admin-page-header">
        <h2>Users</h2>
        <button
          type="button"
          className="admin-primary-btn"
          onClick={() => loadUsers({ preserveLoading: true })}
          disabled={refreshing}
        >
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </header>

      <div className="admin-filter-row admin-filter-row--single">
        <input
          className="admin-filter-input"
          type="search"
          value={searchTerm}
          placeholder="Search by name or email"
          onChange={(event) => setSearchTerm(event.target.value)}
        />
      </div>

      <div className="admin-table-card">
        {filteredUsers.length === 0 ? (
          <EmptyState title="No users" description="No users found." />
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Joined Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user._id}>
                  <td>{user.fullName}</td>
                  <td>{user.email}</td>
                  <td>{user.role}</td>
                  <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
};

export default Users;

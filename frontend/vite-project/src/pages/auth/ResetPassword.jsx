import { useMemo, useState } from "react";
import { Eye, EyeOff, Lock, ShieldCheck } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../api/api";
import "../../styles/reset-password.css";
import BackButton from "../../components/navigation/BackButton";

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);

  const strength = useMemo(() => {
    let score = 0;

    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    return score;
  }, [password]);

  const strengthText = ["Very Weak", "Weak", "Fair", "Strong", "Very Strong"][
    strength
  ];

  const strengthWidth = ["0%", "25%", "50%", "75%", "100%"][strength];

  const passwordsMatch =
    password && confirmPassword && password === confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!token) {
      toast.error("Invalid or missing reset token.");
      return;
    }

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      const response = await api.post("/auth/user/reset-password", {
        token,
        password,
      });

      toast.success(response.data.message);

      setTimeout(() => {
        navigate("/user/login");
      }, 1500);
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reset-page">
      <div className="reset-card">
        <BackButton />
        <div className="reset-logo">
          <ShieldCheck size={38} />
        </div>

        <h1 className="reset-title">FoodieK</h1>

        <p className="reset-subtitle">Reset your password securely</p>

        <form className="reset-form" onSubmit={handleSubmit}>
          <div className="field">
            <label>New Password</label>

            <div className="input-wrapper">
              <Lock size={18} className="input-icon" />

              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter new password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              <button
                type="button"
                className="eye-btn"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff /> : <Eye />}
              </button>
            </div>
          </div>

          <div className="field">
            <label>Confirm Password</label>

            <div className="input-wrapper">
              <Lock size={18} className="input-icon" />

              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />

              <button
                type="button"
                className="eye-btn"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff /> : <Eye />}
              </button>
            </div>
          </div>

          <div className="strength">
            <div className="strength-top">
              <span>Password Strength</span>
              <strong>{strengthText}</strong>
            </div>

            <div className="progress">
              <div
                className="progress-fill"
                style={{
                  width: strengthWidth,
                }}
              />
            </div>
          </div>

          {confirmPassword &&
            (passwordsMatch ? (
              <p className="match success">✓ Passwords match</p>
            ) : (
              <p className="match error">Passwords do not match</p>
            ))}

          <button
            type="submit"
            className="reset-btn"
            disabled={!passwordsMatch || loading}
          >
            {loading ? "Resetting Password..." : "Reset Password"}
          </button>
        </form>

        <div className="reset-footer">
          This reset link expires in <strong>15 minutes</strong>
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;

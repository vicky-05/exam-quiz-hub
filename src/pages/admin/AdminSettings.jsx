import { useEffect, useState } from "react";
import {
  CheckCircle2,
  KeyRound,
  Loader2,
  LogOut,
  Mail,
  RefreshCw,
  ShieldCheck,
  User,
} from "lucide-react";

import { supabase } from "../../services/supabase";
import { useAuth } from "../../context/AuthContext";

function AdminSettings() {
  const { user, profile, signOut } =
    useAuth();

  const [fullName, setFullName] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [passwordLoading, setPasswordLoading] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  const [passwordMessage, setPasswordMessage] =
    useState("");

  const [passwordError, setPasswordError] =
    useState("");

  const [newPassword, setNewPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  useEffect(() => {
    setFullName(
      profile?.full_name || ""
    );
  }, [profile]);

  // ==========================================
  // UPDATE PROFILE
  // ==========================================

  async function handleProfileUpdate(
    event
  ) {
    event.preventDefault();

    try {
      setLoading(true);
      setMessage("");
      setError("");

      if (!fullName.trim()) {
        setError(
          "Full name cannot be empty."
        );
        return;
      }

      const {
        error: updateError,
      } = await supabase
        .from("profiles")
        .update({
          full_name:
            fullName.trim(),
          updated_at:
            new Date().toISOString(),
        })
        .eq(
          "id",
          user.id
        );

      if (updateError) {
        throw updateError;
      }

      setMessage(
        "Profile updated successfully."
      );
    } catch (err) {
      console.error(
        "Profile update error:",
        err
      );

      setError(
        err.message ||
          "Failed to update profile."
      );
    } finally {
      setLoading(false);
    }
  }

  // ==========================================
  // CHANGE PASSWORD
  // ==========================================

  async function handlePasswordChange(
    event
  ) {
    event.preventDefault();

    setPasswordMessage("");
    setPasswordError("");

    if (
      newPassword.length < 6
    ) {
      setPasswordError(
        "Password must contain at least 6 characters."
      );
      return;
    }

    if (
      newPassword !==
      confirmPassword
    ) {
      setPasswordError(
        "Passwords do not match."
      );
      return;
    }

    try {
      setPasswordLoading(
        true
      );

      const {
        error: updateError,
      } = await supabase.auth.updateUser(
        {
          password:
            newPassword,
        }
      );

      if (updateError) {
        throw updateError;
      }

      setNewPassword("");
      setConfirmPassword("");

      setPasswordMessage(
        "Password updated successfully."
      );
    } catch (err) {
      console.error(
        "Password update error:",
        err
      );

      setPasswordError(
        err.message ||
          "Failed to update password."
      );
    } finally {
      setPasswordLoading(
        false
      );
    }
  }

  // ==========================================
  // SIGN OUT
  // ==========================================

  async function handleSignOut() {
    try {
      await signOut();
    } catch (err) {
      console.error(
        "Sign out error:",
        err
      );

      setError(
        err.message ||
          "Failed to sign out."
      );
    }
  }

  return (
    <div
      style={{
        padding: "28px",
        background: "#F7F9FC",
        minHeight: "100vh",
      }}
    >
      {/* HEADER */}

      <div
        style={{
          marginBottom: "24px",
        }}
      >
        <h1
          style={{
            margin: 0,
            color: "#10233F",
            fontSize: "28px",
            fontWeight: 700,
          }}
        >
          Settings
        </h1>

        <p
          style={{
            margin: "6px 0 0",
            color: "#667085",
            fontSize: "14px",
          }}
        >
          Manage your administrator
          profile and account security.
        </p>
      </div>

      {/* ALERT */}

      {error && (
        <div
          style={errorBox}
        >
          {error}
        </div>
      )}

      {message && (
        <div
          style={successBox}
        >
          <CheckCircle2
            size={17}
          />
          {message}
        </div>
      )}

      {/* ====================================== */}
      {/* PROFILE */}
      {/* ====================================== */}

      <section
        style={cardStyle}
      >
        <div
          style={sectionHeader}
        >
          <div
            style={sectionIcon}
          >
            <User size={20} />
          </div>

          <div>
            <h2
              style={sectionTitle}
            >
              Admin Profile
            </h2>

            <p
              style={sectionDescription}
            >
              Update your administrator
              profile information.
            </p>
          </div>
        </div>

        <form
          onSubmit={
            handleProfileUpdate
          }
        >
          <div
            style={{
              display: "grid",
              gap: "18px",
              maxWidth: "700px",
            }}
          >
            {/* NAME */}

            <div>
              <label
                style={labelStyle}
              >
                Full Name
              </label>

              <input
                value={fullName}
                onChange={(event) =>
                  setFullName(
                    event.target.value
                  )
                }
                placeholder="Enter your name"
                style={inputStyle}
              />
            </div>

            {/* EMAIL */}

            <div>
              <label
                style={labelStyle}
              >
                Email Address
              </label>

              <div
                style={{
                  position:
                    "relative",
                }}
              >
                <Mail
                  size={17}
                  style={{
                    position:
                      "absolute",
                    left: "12px",
                    top: "50%",
                    transform:
                      "translateY(-50%)",
                    color:
                      "#98A2B3",
                  }}
                />

                <input
                  value={
                    profile?.email ||
                    user?.email ||
                    ""
                  }
                  disabled
                  style={{
                    ...inputStyle,
                    paddingLeft:
                      "38px",
                    background:
                      "#F2F4F7",
                    color:
                      "#667085",
                  }}
                />
              </div>

              <p
                style={helpText}
              >
                Email address is managed
                by Supabase authentication.
              </p>
            </div>

            {/* ROLE + STATUS */}

            <div
              style={{
                display:
                  "grid",
                gridTemplateColumns:
                  "1fr 1fr",
                gap: "14px",
              }}
            >
              <div>
                <label
                  style={
                    labelStyle
                  }
                >
                  Role
                </label>

                <div
                  style={
                    readOnlyBox
                  }
                >
                  <ShieldCheck
                    size={17}
                  />

                  <span>
                    {profile?.role ||
                      "admin"}
                  </span>
                </div>
              </div>

              <div>
                <label
                  style={
                    labelStyle
                  }
                >
                  Account Status
                </label>

                <div
                  style={{
                    ...readOnlyBox,
                    color:
                      "#027A48",
                  }}
                >
                  <CheckCircle2
                    size={17}
                  />

                  <span>
                    {profile?.status ||
                      "approved"}
                  </span>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                ...primaryButton,
                width: "fit-content",
                opacity:
                  loading ? 0.7 : 1,
              }}
            >
              {loading ? (
                <>
                  <Loader2
                    size={16}
                    style={{
                      animation:
                        "adminSettingsSpin 1s linear infinite",
                    }}
                  />

                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle2
                    size={16}
                  />

                  Save Profile
                </>
              )}
            </button>
          </div>
        </form>
      </section>

      {/* ====================================== */}
      {/* PASSWORD */}
      {/* ====================================== */}

      <section
        style={cardStyle}
      >
        <div
          style={sectionHeader}
        >
          <div
            style={sectionIcon}
          >
            <KeyRound size={20} />
          </div>

          <div>
            <h2
              style={sectionTitle}
            >
              Change Password
            </h2>

            <p
              style={sectionDescription}
            >
              Update the password used
              to sign in to your account.
            </p>
          </div>
        </div>

        {passwordError && (
          <div
            style={errorBox}
          >
            {passwordError}
          </div>
        )}

        {passwordMessage && (
          <div
            style={successBox}
          >
            <CheckCircle2
              size={17}
            />
            {passwordMessage}
          </div>
        )}

        <form
          onSubmit={
            handlePasswordChange
          }
        >
          <div
            style={{
              display: "grid",
              gap: "16px",
              maxWidth: "700px",
            }}
          >
            <div>
              <label
                style={labelStyle}
              >
                New Password
              </label>

              <input
                type="password"
                value={newPassword}
                onChange={(event) =>
                  setNewPassword(
                    event.target.value
                  )
                }
                placeholder="Enter new password"
                style={inputStyle}
              />
            </div>

            <div>
              <label
                style={labelStyle}
              >
                Confirm New Password
              </label>

              <input
                type="password"
                value={
                  confirmPassword
                }
                onChange={(event) =>
                  setConfirmPassword(
                    event.target.value
                  )
                }
                placeholder="Confirm new password"
                style={inputStyle}
              />
            </div>

            <button
              type="submit"
              disabled={
                passwordLoading
              }
              style={{
                ...primaryButton,
                width: "fit-content",
                opacity:
                  passwordLoading
                    ? 0.7
                    : 1,
              }}
            >
              {passwordLoading ? (
                <>
                  <Loader2
                    size={16}
                    style={{
                      animation:
                        "adminSettingsSpin 1s linear infinite",
                    }}
                  />

                  Updating...
                </>
              ) : (
                <>
                  <KeyRound
                    size={16}
                  />

                  Update Password
                </>
              )}
            </button>
          </div>
        </form>
      </section>

      {/* ====================================== */}
      {/* SESSION */}
      {/* ====================================== */}

      <section
        style={cardStyle}
      >
        <div
          style={sectionHeader}
        >
          <div
            style={sectionIcon}
          >
            <RefreshCw
              size={20}
            />
          </div>

          <div>
            <h2
              style={sectionTitle}
            >
              Account Session
            </h2>

            <p
              style={sectionDescription}
            >
              Sign out from the current
              administrator session.
            </p>
          </div>
        </div>

        <button
          onClick={
            handleSignOut
          }
          style={dangerButton}
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </section>

      <style>
        {`
          @keyframes adminSettingsSpin {
            from {
              transform: rotate(0deg);
            }

            to {
              transform: rotate(360deg);
            }
          }
        `}
      </style>
    </div>
  );
}

// ==============================================
// STYLES
// ==============================================

const cardStyle = {
  background: "#FFFFFF",
  border: "1px solid #E4E7EC",
  borderRadius: "10px",
  padding: "22px",
  marginBottom: "18px",
};

const sectionHeader = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  marginBottom: "20px",
};

const sectionIcon = {
  width: "40px",
  height: "40px",
  borderRadius: "9px",
  background: "#EAF4FF",
  color: "#003B82",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const sectionTitle = {
  margin: 0,
  color: "#10233F",
  fontSize: "17px",
};

const sectionDescription = {
  margin: "4px 0 0",
  color: "#667085",
  fontSize: "13px",
};

const labelStyle = {
  display: "block",
  marginBottom: "6px",
  color: "#344054",
  fontSize: "13px",
  fontWeight: 600,
};

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  height: "42px",
  border: "1px solid #D0D5DD",
  borderRadius: "8px",
  padding: "0 12px",
  background: "#FFFFFF",
  color: "#10233F",
  outline: "none",
  fontSize: "14px",
};

const readOnlyBox = {
  height: "42px",
  boxSizing: "border-box",
  border: "1px solid #E4E7EC",
  borderRadius: "8px",
  padding: "0 12px",
  background: "#F9FAFB",
  color: "#003B82",
  display: "flex",
  alignItems: "center",
  gap: "8px",
  fontSize: "14px",
  fontWeight: 600,
};

const helpText = {
  margin: "5px 0 0",
  color: "#98A2B3",
  fontSize: "11px",
};

const primaryButton = {
  border: "none",
  background: "#003B82",
  color: "#FFFFFF",
  padding: "10px 16px",
  borderRadius: "8px",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: "7px",
  fontWeight: 600,
};

const dangerButton = {
  border: "1px solid #FECDD3",
  background: "#FFF1F2",
  color: "#BE123C",
  padding: "10px 16px",
  borderRadius: "8px",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: "7px",
  fontWeight: 600,
};

const errorBox = {
  background: "#FFF1F2",
  border: "1px solid #FECDD3",
  color: "#BE123C",
  padding: "12px 14px",
  borderRadius: "8px",
  marginBottom: "18px",
};

const successBox = {
  background: "#ECFDF3",
  border: "1px solid #ABEFC6",
  color: "#027A48",
  padding: "12px 14px",
  borderRadius: "8px",
  marginBottom: "18px",
  display: "flex",
  alignItems: "center",
  gap: "7px",
};

export default AdminSettings;
import { createContext, useContext, useEffect, useState } from "react";

import { apiRequest } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem("cthru-token");

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const data = await apiRequest("/auth/profile");
        setUser(data.user);
      } catch {
        localStorage.removeItem("cthru-token");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const register = async ({ name, email, password }) => {
    const data = await apiRequest("/auth/register", {
      method: "POST",
      body: JSON.stringify({
        name,
        email,
        password,
      }),
    });

    localStorage.setItem("cthru-token", data.token);
    setUser(data.user);

    return data;
  };

  const login = async ({ email, password }) => {
    const data = await apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email,
        password,
      }),
    });

    localStorage.setItem("cthru-token", data.token);
    setUser(data.user);

    return data;
  };

  const forgotPassword = async (email) => {
    return await apiRequest("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({
        email,
      }),
    });
  };

  const resetPassword = async (token, password) => {
    return await apiRequest(`/auth/reset-password/${token}`, {
      method: "POST",
      body: JSON.stringify({
        password,
      }),
    });
  };

  const updateProfile = async ({ name, email }) => {
    const data = await apiRequest("/auth/profile", {
      method: "PUT",
      body: JSON.stringify({
        name,
        email,
      }),
    });

    setUser(data.user);
    return data;
  };

  const changePassword = async ({ currentPassword, newPassword }) => {
    return await apiRequest("/auth/change-password", {
      method: "PUT",
      body: JSON.stringify({
        currentPassword,
        newPassword,
      }),
    });
  };

  const deleteAccount = async () => {
    const data = await apiRequest("/auth/account", {
      method: "DELETE",
    });
    logout();
    return data;
  };

  const logout = () => {
    localStorage.removeItem("cthru-token");
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: Boolean(user),
        register,
        login,
        logout,
        forgotPassword,
        resetPassword,
        updateProfile,
        changePassword,
        deleteAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}


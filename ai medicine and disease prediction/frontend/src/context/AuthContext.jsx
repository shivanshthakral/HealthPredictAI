import React, { createContext, useState, useContext, useEffect } from "react";
import axios from "axios";

const API_BASE = "http://127.0.0.1:5000";

const AuthContext = createContext();

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("auth_token") || null);
  const [loading, setLoading] = useState(true);

  // Set axios default header
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchUser = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/auth/me`);
      setUser(res.data.user);
    } catch (err) {
      console.error("Failed to fetch user:", err);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      console.log("Logging in user:", email);
      const res = await axios.post(`${API_BASE}/api/auth/login`, {
        email,
        password,
      });
      
      console.log("Login response:", res.data);
      
      const { token: newToken, user: userData } = res.data;
      
      if (!newToken || !userData) {
        return {
          success: false,
          error: "Invalid response from server",
        };
      }
      
      setToken(newToken);
      setUser(userData);
      localStorage.setItem("auth_token", newToken);
      axios.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;
      
      return { success: true };
    } catch (err) {
      console.error("Login error:", err);
      const errorMessage = err.response?.data?.error || err.message || "Login failed. Please check your credentials.";
      return {
        success: false,
        error: errorMessage,
      };
    }
  };

  const register = async (userData) => {
    try {
      console.log("Registering user:", userData.email);
      console.log("Registration data being sent:", userData);
      console.log("API Base URL:", API_BASE);
      
      // Try registration directly - don't block on health check
      console.log("Attempting to register at:", `${API_BASE}/api/auth/register`);
      
      const res = await axios.post(`${API_BASE}/api/auth/register`, userData, {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 10000, // 10 second timeout
        withCredentials: false, // Don't send credentials for CORS
      });
      
      console.log("Registration response status:", res.status);
      console.log("Registration response data:", res.data);
      
      // Check if registration was successful
      if (res.status === 201 && res.data.user) {
        console.log("Registration successful, attempting auto-login...");
        // Auto-login after registration
        const loginRes = await login(userData.email, userData.password);
        return loginRes;
      } else {
        return {
          success: false,
          error: res.data?.error || "Registration succeeded but user data not received",
        };
      }
    } catch (err) {
      console.error("Registration error details:", err);
      console.error("Error response:", err.response?.data);
      console.error("Error status:", err.response?.status);
      console.error("Error code:", err.code);
      
      let errorMessage = "Registration failed. Please check your connection.";
      
      if (err.code === "ECONNREFUSED" || err.code === "ERR_NETWORK" || err.code === "ERR_CONNECTION_REFUSED") {
        errorMessage = "Cannot connect to backend server. Please make sure the backend is running on http://127.0.0.1:5000. Check the backend terminal to confirm it's running.";
      } else if (err.code === "ETIMEDOUT" || err.code === "ECONNABORTED") {
        errorMessage = "Connection timeout. The server is taking too long to respond. Please check if the backend is running.";
      } else if (err.response) {
        // Server responded with error
        errorMessage = err.response.data?.error || `Server error: ${err.response.status} - ${err.response.statusText}`;
      } else if (err.request) {
        // Request made but no response
        errorMessage = `Cannot connect to server at ${API_BASE}. Please make sure the backend is running. Open http://127.0.0.1:5000/health in your browser to verify.`;
      } else {
        // Something else happened
        errorMessage = err.message || "An unexpected error occurred";
      }
      
      return {
        success: false,
        error: errorMessage,
      };
    }
  };

  const logout = async () => {
    try {
      if (token) {
        await axios.post(`${API_BASE}/api/auth/logout`);
      }
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      setToken(null);
      setUser(null);
      localStorage.removeItem("auth_token");
      delete axios.defaults.headers.common["Authorization"];
    }
  };

  const updateProfile = async (profileData) => {
    try {
      const res = await axios.put(`${API_BASE}/api/auth/profile`, profileData);
      setUser(res.data.user);
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.error || "Profile update failed",
      };
    }
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    updateProfile,
    isAuthenticated: !!token && !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

import { createContext, useContext, useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import { axiosInstance, setupAxiosInterceptors } from "../utils/axios";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  // Function to check if token is expired
  const isTokenExpired = (token) => {
    try {
      const decoded = jwtDecode(token);
      const currentTime = Date.now() / 1000;
      return decoded.exp < currentTime;
    } catch (error) {
      return true;
    }
  };

  // Initialize auth state and setup interceptors
  useEffect(() => {
    const initializeAuth = () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          // Check if token is expired
          if (isTokenExpired(token)) {
            logout();
          } else {
            const decoded = jwtDecode(token);
            setUser({
              id: decoded.userId,
              role: decoded.role,
              token,
            });

            setupAxiosInterceptors(logout);
          }
        } catch (error) {
          console.error("Token validation failed:", error);
          logout();
        }
      }
      setLoading(false);
    };

    initializeAuth();

    // Set up periodic token check
    const tokenCheckInterval = setInterval(() => {
      const token = localStorage.getItem("token");
      if (token && isTokenExpired(token)) {
        logout();
        window.location.replace("/login");
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(tokenCheckInterval);
  }, []);

  const login = async (token, userData) => {
    try {
      // Verify token isn't expired before setting
      if (isTokenExpired(token)) {
        throw new Error("Token is expired");
      }

      localStorage.setItem("token", token);
      setUser({
        id: userData.id,
        role: userData.role,
        token,
      });

      setupAxiosInterceptors(logout);
    } catch (error) {
      console.error("Login failed:", error);
      logout();
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

import { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import api from "../api/axios";

const AuthContext = createContext();

export const AuthContextProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState(null);

  const fetchAppRole = async (currentSession) => {
    if (!currentSession?.access_token) {
      setRole(null);
      return null;
    }

    try {
      const response = await api.get('/auth/role');
      const nextRole = response?.data?.role;
      const normalizedRole = nextRole ? String(nextRole).toUpperCase() : null;
      setRole(normalizedRole);
      return normalizedRole;
    } catch (error) {
      console.error('Failed to fetch app role:', error);
      setRole(null);
      return null;
    }
  };

  // Sign up

  const signUpNewUser = async (email, password, extraData = {}) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role: "TECH",
          ...extraData,
        },
      },
    });

    if (error) {
      console.error("Error signing up:", error);
      return { success: false, error };
    }

    if (data?.session) {
      setSession(data.session);
      await fetchAppRole(data.session);
    }

    return { success: true, data };
  };

  // Sign in

  const signInUser = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase(),
        password: password,
      });

      if (error) {
        console.error("Error signing in:", error.message);
        return { success: false, error: error.message };
      }

      if (data?.session) {
        setSession(data.session);
        await fetchAppRole(data.session);
      }

      console.log("Sign in successful:", data);

      return { success: true, data };
    } catch (error) {
      console.error("Error signing in:", error.message);
      return { success: false, error: "An unexpected error occurred. Please try again." };
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      if (currentSession) {
        fetchAppRole(currentSession);
      } else {
        setRole(null);
      }
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, currentSession) => {
      setSession(currentSession);
      if (currentSession) {
        await fetchAppRole(currentSession);
      } else {
        setRole(null);
      }
      setLoading(false);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  // Sign out
  const signOut = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error(error);
      return;
    }

    setSession(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider value={{ session, role, loading, signUpNewUser, signOut, signInUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const UserAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('UserAuth must be used inside an AuthContextProvider');
  }
  return context;
}
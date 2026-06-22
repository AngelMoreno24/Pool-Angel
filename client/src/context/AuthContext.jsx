import { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../supabaseClient";


const AuthContext = createContext();

export const AuthContextProvider = ({ children }) => {
  const [ session, setSession ] = useState(undefined);

  

  // Sign up

  const signUpNewUser = async (email, password) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      console.error("Error signing up:", error);
      return { success: false, error };
    }

    return { success: true, data };
  };


  // Sign in

  const signInUser = async ({email, password}) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (error) {
        console.error("Error signing in:", error);
        return { success: false, error: error.message };
      }

      console.log("Sign in successful:", data);

    } catch (error) {
      console.error("Error signing in:", error);
      return { success: false, error };
    }
  }



  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

  }, []);
 
  // Sign out 
  const signOut = () => {
    const { error } = supabase.auth.signOut();
    if (error) {
      console.error("Error signing out:", error);
    }
  }

  return (
    <AuthContext.Provider value={{ session, signUpNewUser, signOut, signInUser }}>
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
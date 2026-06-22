import supabase from "../lib/supabase";

export const register = async (
  email,
  password
) => {
  return supabase.auth.signUp({
    email,
    password,
  });
};

export const login = async (
  email,
  password
) => {
  return supabase.auth.signInWithPassword({
    email,
    password,
  });
};

export const logout = async () => {
  return supabase.auth.signOut();
};
import { supabase } from "./supabase";

export async function login({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  // console.log("Login data iz logina:", data);

  if (error) throw new Error(error.message);

  return data;
}

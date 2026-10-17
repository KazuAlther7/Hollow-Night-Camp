import { supabase } from "../config/supabase.js";

// REGISTER READER
export async function registerReader(username, email, password) {
const { data, error } = await supabase.auth.signUp({
email: email.trim(),
password,
options: {
data: {
nickname: username.trim()
},
emailRedirectTo: window.location.origin +
window.location.pathname
}
});

if (error) {
throw error;
}

return data;
}

// LOGIN READER
export async function loginReader(email, password) {
const { data, error } = await supabase.auth.signInWithPassword({
email: email.trim(),
password
});

if (error) {
throw error;
}

return data;
}

// LOGOUT READER
export async function logoutReader() {
const { error } = await supabase.auth.signOut();

if (error) {
throw error;
}
}

// DETEKSI STATUS LOGIN
export function observeAuthState(callback) {
return supabase.auth.onAuthStateChange((event, session) => {
callback(event, session);
});
}

// AMBIL PROFIL READER
export async function getReaderProfile(userId) {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, nickname, bio, avatar_url, role")
    .eq("id", userId)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

// UPDATE PROFIL READER
export async function updateReaderProfile(userId, profile) {
  const { data, error } = await supabase
    .from("profiles")
    .update({
      nickname: profile.nickname.trim(),
      bio: profile.bio.trim(),
      avatar_url: profile.avatar_url || null,
      updated_at: new Date().toISOString()
    })
    .eq("id", userId)
    .select("id, nickname, bio, avatar_url, role")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

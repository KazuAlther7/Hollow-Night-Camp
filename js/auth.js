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

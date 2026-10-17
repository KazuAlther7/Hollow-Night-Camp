import { supabase } from '../config/supabase.js';

export async function registerReader(email, password, username) {
const { data, error } = await supabase.auth.signUp({
email,
password,
options: {
data: {
username
},
emailRedirectTo: window.location.origin +
'/Hollow-Night-Camp/'
}
});

if (error) throw error;

return data;
}

export async function loginReader(email, password) {
const { data, error } = await supabase.auth.signInWithPassword({
email,
password
});

if (error) throw error;

return data;
}

export async function logoutReader() {
const { error } = await supabase.auth.signOut();

if (error) throw error;
}

export async function getCurrentReader() {
const { data, error } = await supabase.auth.getUser();

if (error) throw error;

return data.user;
}

export function observeAuthState(callback) {
return supabase.auth.onAuthStateChange((event, session) => {
callback(event, session);
});
}

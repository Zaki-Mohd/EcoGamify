// This is JavaScript, NOT SQL
// Use this in your React component

import { createClient } from '@supabase/supabase-js';

// Initialize your Supabase client
const supabase = createClient('YOUR_PROJECT_URL', 'YOUR_ANON_KEY');

async function handleLogin() {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'zaki@gmail.com',
    password: 'zaki', // Your frontend sends the plain password
  });

  if (error) {
    console.error('Error logging in:', error.message);
  } else {
    console.log('Login successful!', data.user);
    // Redirect to the game page
    // window.location.href = '/game';
  }
}

// You would then call handleLogin() when a user clicks your login button.
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/services/supabase';
import { User } from '@/types';
import * as SecureStore from 'expo-secure-store';
import { Platform, Alert } from 'react-native';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string, fullName: string, username: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error?: string }>;
  updatePoints: (points: number) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    getSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        
        if (session?.user) {
          await fetchUserProfile(session.user.id);
          
          // Show success message for sign in
          if (event === 'SIGNED_IN') {
            Alert.alert('Welcome!', 'You have successfully logged in.', [{ text: 'OK' }]);
          }
        } else {
          setUser(null);
        }
        
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function getSession() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error getting session:', error);
        setLoading(false);
        return;
      }

      if (session?.user) {
        await fetchUserProfile(session.user.id);
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error('Error getting session:', error);
      setLoading(false);
    }
  }

  async function fetchUserProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        return;
      }

      setUser(data);
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  }

  async function signIn(email: string, password: string) {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        console.error('Sign in error:', error);
        return { error: error.message };
      }

      if (data.user) {
        await fetchUserProfile(data.user.id);
        
        // Store session securely (only on native platforms)
        if (Platform.OS !== 'web' && data.session) {
          try {
            await SecureStore.setItemAsync('userSession', JSON.stringify(data.session));
          } catch (storeError) {
            console.warn('Could not store session securely:', storeError);
          }
        }
      }

      return {};
    } catch (error: any) {
      console.error('Sign in error:', error);
      return { error: error.message || 'An unexpected error occurred' };
    } finally {
      setLoading(false);
    }
  }

  async function signUp(email: string, password: string, fullName: string, username: string) {
    try {
      setLoading(true);
      
      // First, sign up the user with email confirmation
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        console.error('Sign up error:', error);
        return { error: error.message };
      }

      if (!data.user) {
        return { error: 'Failed to create user account' };
      }

      // Create user profile
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: data.user.id,
          email: email.trim().toLowerCase(),
          full_name: fullName.trim(),
          username: username.trim().toLowerCase(),
          points: 0,
        });

      if (profileError) {
        console.error('Profile creation error:', profileError);
        return { error: 'Failed to create user profile: ' + profileError.message };
      }

      // Show success message
      Alert.alert(
        'Account Created!', 
        'Your account has been created successfully. Please check your email to verify your account.',
        [{ text: 'OK' }]
      );

      // If user is immediately confirmed (e.g., in development)
      if (data.user.email_confirmed_at) {
        await fetchUserProfile(data.user.id);
        
        // Store session securely (only on native platforms)
        if (Platform.OS !== 'web' && data.session) {
          try {
            await SecureStore.setItemAsync('userSession', JSON.stringify(data.session));
          } catch (storeError) {
            console.warn('Could not store session securely:', storeError);
          }
        }
      }

      return {};
    } catch (error: any) {
      console.error('Sign up error:', error);
      return { error: error.message || 'An unexpected error occurred' };
    } finally {
      setLoading(false);
    }
  }

  async function resetPassword(email: string) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback`,
      });

      if (error) {
        console.error('Reset password error:', error);
        return { error: error.message };
      }

      return {};
    } catch (error: any) {
      console.error('Reset password error:', error);
      return { error: error.message || 'An unexpected error occurred' };
    }
  }

  async function signOut() {
    try {
      setLoading(true);
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Sign out error:', error);
      }

      // Clear stored session (only on native platforms)
      if (Platform.OS !== 'web') {
        try {
          await SecureStore.deleteItemAsync('userSession');
        } catch (storeError) {
          console.warn('Could not clear stored session:', storeError);
        }
      }

      setUser(null);
      Alert.alert('Signed Out', 'You have been successfully signed out.', [{ text: 'OK' }]);
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setLoading(false);
    }
  }

  async function updatePoints(points: number) {
    if (!user) return;

    try {
      const newPoints = user.points + points;
      const { error } = await supabase
        .from('users')
        .update({ points: newPoints })
        .eq('id', user.id);

      if (error) {
        console.error('Error updating points:', error);
        return;
      }
      
      setUser({ ...user, points: newPoints });
    } catch (error) {
      console.error('Error updating points:', error);
    }
  }

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePoints,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
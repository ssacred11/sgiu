import { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { supabase } from '../supabaseClient';
import { Session } from '@supabase/supabase-js';

interface UserProfile {
  id: string;
  name: string;
  email: string | undefined;
  role: string;
}

interface AuthContextType {
  user: UserProfile | null;
  session: Session | null;
  isAuthenticated: boolean;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setIsLoading(true);

        if (session) {
          setSession(session);

          const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (error) {
            console.error('Error al buscar el perfil:', error.message);
          } else if (profile) {
            setUser({
              id: session.user.id,
              email: session.user.email,
              name: profile.name,
              role: profile.role,
            });
          }
        } else {
          setSession(null);
          setUser(null);
        }

        setIsLoading(false);
      }
    );

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error al cerrar sesión:', error.message);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isAuthenticated: !!session,
        logout,
        isLoading,
      }}
    >
      {!isLoading ? children : null}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
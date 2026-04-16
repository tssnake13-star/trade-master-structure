import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

type UserRole = 'admin' | 'student';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  role: UserRole | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  role: null,
  loading: true,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          // Fetch role with setTimeout to avoid Supabase auth deadlock
          setTimeout(async () => {
            const [{ data: roleData }, { data: profileData }] = await Promise.all([
              supabase
                .from('user_roles')
                .select('role')
                .eq('user_id', session.user.id)
                .single(),
              supabase
                .from('profiles')
                .select('is_blocked')
                .eq('user_id', session.user.id)
                .single(),
            ]);

            if (profileData?.is_blocked) {
              await supabase.auth.signOut();
              setSession(null);
              setUser(null);
              setRole(null);
              setLoading(false);
              alert('Доступ приостановлен. Обратитесь к наставнику.');
              return;
            }

            setRole((roleData?.role as UserRole) ?? 'student');
            setLoading(false);
          }, 0);
        } else {
          setRole(null);
          setLoading(false);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (!session) setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ session, user, role, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

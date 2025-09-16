import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: any | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  isInstructor: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Defer profile fetching to avoid deadlock
        if (session?.user) {
          setTimeout(() => {
            fetchUserProfile(session.user.id);
          }, 0);
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserProfile(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    return { error };
  };

  const signOut = async () => {
    try {
      // 1) 우선 글로벌 로그아웃 시도 (서버 세션 만료 포함)
      await supabase.auth.signOut();
    } catch (err) {
      // 서버에 세션이 없을 수 있으므로 로컬만 정리하는 Fallback
      try {
        await supabase.auth.signOut({ scope: 'local' as any });
      } catch {}
    } finally {
      // 2) 혹시 남아있을 수 있는 토큰 로컬스토리지 강제 정리
      try {
        Object.keys(localStorage).forEach((key) => {
          if (key.startsWith('sb-') || key.includes('supabase.auth.token')) {
            localStorage.removeItem(key);
          }
        });
      } catch {}

      // 3) 로컬 상태 초기화
      setProfile(null);
      setUser(null);
      setSession(null);

      toast({
        title: "로그아웃",
        description: "성공적으로 로그아웃되었습니다."
      });

      // 4) 홈으로 이동 (전체 리로드로 상태 초기화 보장)
      window.location.assign('/');
    }
  };

  const isAdmin = profile?.role === 'admin';
  const isInstructor = profile?.role === 'instructor';

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        signIn,
        signOut,
        isAdmin,
        isInstructor
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
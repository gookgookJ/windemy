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
  refreshProfile: () => Promise<void>;
  isAdmin: boolean;
  isInstructor: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [userRoles, setUserRoles] = useState<string[]>([]);
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
          setUserRoles([]);
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
      // profiles 정보 가져오기
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (profileError) throw profileError;

      // user_roles 테이블에서 역할 가져오기
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);
      
      if (rolesError) {
        console.error('Error fetching roles:', rolesError);
      }

      // 역할 배열을 state에 저장
      const roles = rolesData?.map(r => r.role) || [];
      setUserRoles(roles);

      // ⚠️ DEPRECATED: 호환성 코드 제거 예정
      // 이 코드는 profiles.role 컬럼 삭제 전까지만 유지됩니다.
      // 모든 코드가 isAdmin/isInstructor 플래그를 사용하도록 마이그레이션 완료 후 제거됩니다.
      /*
      let userRole = 'student';
      if (rolesData && rolesData.length > 0) {
        if (rolesData.some(r => r.role === 'admin')) {
          userRole = 'admin';
        } else if (rolesData.some(r => r.role === 'instructor')) {
          userRole = 'instructor';
        }
      }
      */

      // profiles 데이터만 저장 (역할 정보 제외)
      setProfile(profileData);
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

  const refreshProfile = async () => {
    if (user?.id) {
      await fetchUserProfile(user.id);
    }
  };

  const signOut = async () => {
    try {
      // 1) 로컬 상태 먼저 초기화 (즉시 UI 반영)
      setProfile(null);
      setUserRoles([]);
      setUser(null);
      setSession(null);

      // 2) 로컬스토리지 정리 (토큰 제거)
      try {
        Object.keys(localStorage).forEach((key) => {
          if (key.startsWith('sb-') || key.includes('supabase.auth.token')) {
            localStorage.removeItem(key);
          }
        });
      } catch {}

      // 3) Supabase 로그아웃은 백그라운드로 처리 (리다이렉트 지연 방지)
      setTimeout(() => {
        supabase.auth.signOut().catch(() => {});
      }, 0);

      toast({
        title: "로그아웃",
        description: "성공적으로 로그아웃되었습니다."
      });

      // 4) 즉시 홈으로 리다이렉트 (히스토리 대체로 뒤로가기 방지)
      window.location.replace('/');
      
    } catch (error) {
      console.error('Logout error:', error);
      window.location.replace('/');
    }
  };

  // user_roles 테이블 기반 역할 체크
  const isAdmin = userRoles.includes('admin');
  const isInstructor = userRoles.includes('instructor');

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        signIn,
        signOut,
        refreshProfile,
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
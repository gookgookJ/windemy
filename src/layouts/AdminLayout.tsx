import { useAuth } from '@/hooks/useAuth';
import { useNavigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import Header from '@/components/Header';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export const AdminLayout = ({ children }: AdminLayoutProps) => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate('/auth');
      return;
    }
    // 임시로 관리자 권한 체크 제거 - 테스트용
  }, [user, authLoading, navigate]);

  // Prevent scroll jumping when navigating between admin pages
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location.pathname]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg">로딩 중...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <SidebarProvider>
        <div className="flex min-h-[calc(100vh-64px)] w-full pt-16">
          <AdminSidebar />
          <main className="flex-1 overflow-auto">
            <div className="container mx-auto p-6 pt-8" style={{ scrollBehavior: 'smooth' }}>
              {children}
            </div>
          </main>
        </div>
      </SidebarProvider>
    </div>
  );
};
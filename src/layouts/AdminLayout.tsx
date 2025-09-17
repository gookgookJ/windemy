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
  const { user, loading, profile, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate('/');
      return;
    }
    // 관리자가 아닌 경우 홈으로 리다이렉트
    if (user && !loading && !isAdmin) {
      navigate('/');
      return;
    }
  }, [user, loading, navigate, isAdmin]);

  // Prevent scroll jumping when navigating between admin pages
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location.pathname]);

  if (loading) {
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
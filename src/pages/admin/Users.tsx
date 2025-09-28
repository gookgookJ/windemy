import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/layouts/AdminLayout';
import { UserDashboard } from '@/components/admin/UserDashboard';
import { UserFilters, UserFilterOptions } from '@/components/admin/UserFilters';
import { UserTable } from '@/components/admin/UserTable';
import { UserDetailModal } from '@/components/admin/UserDetailModal';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// 페이지네이션 상수
const ITEMS_PER_PAGE = 20;

interface UserStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  newUsersThisMonth: number;
  adminUsers: number;
  instructorUsers: number;
  studentUsers: number;
}

export const AdminUsers = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [filters, setFilters] = useState<UserFilterOptions>({
    searchTerm: '',
    status: 'all',
    role: 'all',
    marketingEmail: 'all',
    marketingSms: 'all'
  });
  const { toast } = useToast();

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  // 페이지 변경 시 데이터 다시 fetch
  useEffect(() => {
    fetchUsers();
  }, [filters, currentPage]);

  // Stats는 별도로 fetch (페이지네이션과 무관)
  useEffect(() => {
    fetchStats();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // 기본 쿼리 설정
      let query = supabase
        .from('profiles')
        .select('*', { count: 'exact' });

      // 검색 필터 적용
      if (filters.searchTerm) {
        query = query.or(`full_name.ilike.%${filters.searchTerm}%,email.ilike.%${filters.searchTerm}%,phone.ilike.%${filters.searchTerm}%`);
      }

      // 역할 필터 적용
      if (filters.role !== 'all') {
        query = query.eq('role', filters.role);
      }

      // 날짜 필터 적용
      if (filters.startDate) {
        query = query.gte('created_at', filters.startDate.toISOString());
      }
      if (filters.endDate) {
        query = query.lte('created_at', filters.endDate.toISOString());
      }

      // 마케팅 동의 필터 적용
      if (filters.marketingEmail !== 'all') {
        query = query.eq('marketing_consent', filters.marketingEmail === 'true');
      }

      // 페이지네이션 적용
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      
      query = query
        .range(from, to)
        .order('created_at', { ascending: false });

      const { data: userData, error: userError, count } = await query;

      if (userError) throw userError;

      // 각 사용자의 총 결제 금액 조회
      const usersWithPayments = await Promise.all(
        (userData || []).map(async (user) => {
          const { data: orders } = await supabase
            .from('orders')
            .select('total_amount')
            .eq('user_id', user.id)
            .eq('status', 'completed');

          const totalPayment = orders?.reduce((sum, order) => sum + order.total_amount, 0) || 0;

          return {
            ...user,
            total_payment: totalPayment,
            status: 'active' // 기본값, 실제 상태 로직은 필요에 따라 구현
          };
        })
      );

      setUsers(usersWithPayments);
      setTotalCount(count || 0);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "사용자 목록 조회 실패",
        description: "사용자 목록을 불러오는데 실패했습니다.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('role, created_at');

      if (error) throw error;

      const now = new Date();
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const stats: UserStats = {
        totalUsers: profiles?.length || 0,
        activeUsers: profiles?.length || 0,
        inactiveUsers: 0,
        newUsersThisMonth: profiles?.filter(p => new Date(p.created_at) >= thisMonth).length || 0,
        adminUsers: profiles?.filter(p => p.role === 'admin').length || 0,
        instructorUsers: profiles?.filter(p => p.role === 'instructor').length || 0,
        studentUsers: profiles?.filter(p => p.role === 'student').length || 0,
      };

      setStats(stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleFiltersChange = (newFilters: UserFilterOptions) => {
    setFilters(newFilters);
    setCurrentPage(1); // 필터 변경 시 첫 페이지로 이동
  };

  const handleResetFilters = () => {
    setFilters({
      searchTerm: '',
      status: 'all',
      role: 'all',
      marketingEmail: 'all',
      marketingSms: 'all'
    });
    setCurrentPage(1);
  };

  const handleUserSelect = (userId: string) => {
    setSelectedUserId(userId);
    setShowDetailModal(true);
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;

      setUsers(users.map(user => 
        user.id === userId ? { ...user, role: newRole } : user
      ));

      toast({
        title: "권한 변경 완료",
        description: "사용자 권한이 성공적으로 변경되었습니다.",
      });
    } catch (error) {
      console.error('Error updating user role:', error);
      toast({
        title: "권한 변경 실패",
        description: "사용자 권한 변경에 실패했습니다.",
        variant: "destructive",
      });
    }
  };

  const handleBulkAction = async (action: string, userIds: string[]) => {
    switch (action) {
      case 'export':
        exportToCSV(userIds);
        break;
      default:
        toast({
          title: "기능 준비 중",
          description: "해당 기능은 추후 구현 예정입니다.",
        });
    }
  };

  const exportToCSV = (userIds: string[]) => {
    const selectedUsers = users.filter(user => userIds.includes(user.id));
    const csvContent = [
      ['이름', '이메일', '역할', '가입일', '총 결제금액'].join(','),
      ...selectedUsers.map(user => [
        user.full_name || '',
        user.email,
        user.role,
        new Date(user.created_at).toLocaleDateString(),
        user.total_payment
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `users_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "내보내기 완료",
      description: "사용자 목록이 CSV 파일로 내보내졌습니다.",
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">사용자 관리</h1>
          <p className="text-muted-foreground">
            CS 문의에 필요한 모든 사용자 정보를 한 곳에서 파악하고 즉시 조치하여 응대 시간을 단축합니다.
          </p>
        </div>

        {/* 1. 요약 대시보드 */}
        <UserDashboard stats={stats} loading={loading} />

        {/* 2. 검색 및 필터링 영역 */}
        <UserFilters
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onReset={handleResetFilters}
        />

        {/* 3. 사용자 목록 테이블 */}
        <div className="space-y-4">
          <UserTable 
            users={users}
            loading={loading}
            onUserSelect={handleUserSelect}
            onRoleChange={handleRoleChange}
            onBulkAction={handleBulkAction}
          />

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-muted-foreground">
                총 {totalCount}개 항목 중 {((currentPage - 1) * ITEMS_PER_PAGE) + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} 표시
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  이전
                </Button>
                
                <div className="flex items-center space-x-1">
                  {[...Array(Math.min(5, totalPages))].map((_, i) => {
                    const pageNum = i + 1;
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className="w-8 h-8 p-0"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                  {totalPages > 5 && currentPage < totalPages - 2 && (
                    <>
                      <span className="px-2">...</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(totalPages)}
                        className="w-8 h-8 p-0"
                      >
                        {totalPages}
                      </Button>
                    </>
                  )}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  다음
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        <UserDetailModal
          userId={selectedUserId}
          open={showDetailModal}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedUserId(null);
          }}
        />
      </div>
    </AdminLayout>
  );
};

export default AdminUsers;
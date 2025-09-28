import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/layouts/AdminLayout';
import { useToast } from '@/hooks/use-toast';
import { UserDashboard } from '@/components/admin/UserDashboard';
import { UserFilters, UserFilterOptions } from '@/components/admin/UserFilters';
import { UserTable, UserTableData } from '@/components/admin/UserTable';
import { UserDetailModal } from '@/components/admin/UserDetailModal';

interface UserStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  adminUsers: number;
  instructorUsers: number;
  studentUsers: number;
  newUsersThisMonth: number;
}

export const AdminUsers = () => {
  const [users, setUsers] = useState<UserTableData[]>([]);
  const [stats, setStats] = useState<UserStats>({
    totalUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    adminUsers: 0,
    instructorUsers: 0,
    studentUsers: 0,
    newUsersThisMonth: 0,
  });
  const [loading, setLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [filters, setFilters] = useState<UserFilterOptions>({
    searchTerm: '',
    status: 'all',
    role: 'all',
    marketingEmail: 'all',
    marketingSms: 'all',
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, [filters]);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          email,
          role,
          created_at,
          phone,
          avatar_url,
          marketing_consent
        `)
        .order('created_at', { ascending: false });

      // 필터 적용
      if (filters.searchTerm) {
        query = query.or(`full_name.ilike.%${filters.searchTerm}%,email.ilike.%${filters.searchTerm}%,phone.ilike.%${filters.searchTerm}%`);
      }

      if (filters.role !== 'all') {
        query = query.eq('role', filters.role);
      }

      if (filters.startDate) {
        query = query.gte('created_at', filters.startDate.toISOString());
      }

      if (filters.endDate) {
        const endDate = new Date(filters.endDate);
        endDate.setHours(23, 59, 59, 999);
        query = query.lte('created_at', endDate.toISOString());
      }

      if (filters.marketingEmail !== 'all') {
        query = query.eq('marketing_consent', filters.marketingEmail === 'true');
      }

      const { data, error } = await query;

      if (error) throw error;

      // 각 사용자의 결제 정보도 함께 가져오기
      const usersWithPayments = await Promise.all((data || []).map(async (user) => {
        const { data: orders } = await supabase
          .from('orders')
          .select('total_amount')
          .eq('user_id', user.id)
          .eq('status', 'completed');

        const totalPayment = (orders || []).reduce((sum, order) => sum + order.total_amount, 0);

        return {
          ...user,
          total_payment: totalPayment,
          status: 'active', // TODO: 실제 상태 로직 구현
          last_login: null, // TODO: 실제 로그인 기록 구현
        };
      }));

      setUsers(usersWithPayments);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "오류",
        description: "사용자 데이터를 불러오는데 실패했습니다.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // 전체 사용자 수
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // 역할별 사용자 수
      const { data: roleStats } = await supabase
        .from('profiles')
        .select('role')
        .not('role', 'is', null);

      const adminUsers = roleStats?.filter(u => u.role === 'admin').length || 0;
      const instructorUsers = roleStats?.filter(u => u.role === 'instructor').length || 0;
      const studentUsers = roleStats?.filter(u => u.role === 'student').length || 0;

      // 신규 가입자 (이번 달)
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);
      const { count: newUsersThisMonth } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', monthStart.toISOString());

      setStats({
        totalUsers: totalUsers || 0,
        activeUsers: totalUsers || 0, // TODO: 실제 활성 사용자 로직
        inactiveUsers: 0, // TODO: 실제 비활성 사용자 로직
        adminUsers,
        instructorUsers,
        studentUsers,
        newUsersThisMonth: newUsersThisMonth || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleFiltersChange = (newFilters: UserFilterOptions) => {
    setFilters(newFilters);
  };

  const handleResetFilters = () => {
    const defaultFilters: UserFilterOptions = {
      searchTerm: '',
      status: 'all',
      role: 'all',
      marketingEmail: 'all',
      marketingSms: 'all',
    };
    setFilters(defaultFilters);
  };

  const handleUserSelect = (userId: string) => {
    setSelectedUserId(userId);
    setDetailModalOpen(true);
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
        title: "성공",
        description: "사용자 권한이 변경되었습니다."
      });
    } catch (error) {
      console.error('Error updating user role:', error);
      toast({
        title: "오류",
        description: "사용자 권한 변경에 실패했습니다.",
        variant: "destructive"
      });
    }
  };

  const handleBulkAction = async (action: string, userIds: string[]) => {
    switch (action) {
      case 'message':
        toast({
          title: "기능 준비 중",
          description: "메시지 발송 기능은 추후 구현 예정입니다."
        });
        break;
      case 'export':
        exportToCSV(userIds);
        break;
      case 'status_change':
        toast({
          title: "기능 준비 중",
          description: "상태 변경 기능은 추후 구현 예정입니다."
        });
        break;
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
      title: "성공",
      description: "사용자 목록이 CSV 파일로 내보내졌습니다."
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
        <UserTable
          users={users}
          loading={loading}
          onUserSelect={handleUserSelect}
          onRoleChange={handleRoleChange}
          onBulkAction={handleBulkAction}
        />

        {/* 4. 사용자 상세 정보 뷰 */}
        <UserDetailModal
          userId={selectedUserId}
          open={detailModalOpen}
          onClose={() => {
            setDetailModalOpen(false);
            setSelectedUserId(null);
          }}
        />
      </div>
    </AdminLayout>
  );
};

export default AdminUsers;
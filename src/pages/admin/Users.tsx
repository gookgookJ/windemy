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
  newUsersToday: number;
  newUsersThisWeek: number;
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
    newUsersToday: 0,
    newUsersThisWeek: 0,
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
    fetchStats();
  }, []);

  const fetchUsers = async () => {
    try {
      // DB 연결 해제 - 임시 mock 데이터로 대체
      setLoading(true);
      
      // 임시 딜레이로 로딩 상태 시뮬레이션
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock 사용자 데이터
      const mockUsers = [
        {
          id: '1',
          full_name: '김영희',
          email: 'kim.younghee@example.com',
          role: 'student',
          created_at: '2024-01-15T10:30:00Z',
          phone: '010-1234-5678',
          avatar_url: null,
          marketing_consent: true,
          total_payment: 89000,
          status: 'active',
          last_login: '2024-03-20T14:22:00Z'
        },
        {
          id: '2',
          full_name: '이철수',
          email: 'lee.chulsoo@example.com',
          role: 'instructor',
          created_at: '2023-11-08T09:15:00Z',
          phone: '010-2345-6789',
          avatar_url: null,
          marketing_consent: false,
          total_payment: 245000,
          status: 'active',
          last_login: '2024-03-19T16:45:00Z'
        },
        {
          id: '3',
          full_name: '박민지',
          email: 'park.minji@example.com',
          role: 'student',
          created_at: '2024-02-20T11:00:00Z',
          phone: '010-3456-7890',
          avatar_url: null,
          marketing_consent: true,
          total_payment: 156000,
          status: 'active',
          last_login: '2024-03-18T09:30:00Z'
        }
      ];

      setUsers(mockUsers);
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
      // DB 연결 해제 - 임시 mock 데이터로 대체
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Mock 통계 데이터
      const mockStats = {
        totalUsers: 847,
        activeUsers: 692,
        inactiveUsers: 155,
        adminUsers: 3,
        instructorUsers: 24,
        studentUsers: 820,
        newUsersToday: 12,
        newUsersThisWeek: 84,
        newUsersThisMonth: 84, // UserDashboard에서 요구하는 필드 추가
      };

      setStats(mockStats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleFiltersChange = (newFilters: UserFilterOptions) => {
    setFilters(newFilters);
    setLoading(true);
    fetchUsers();
  };

  const handleResetFilters = () => {
    const defaultFilters = {
      searchTerm: '',
      status: 'all',
      role: 'all',
      marketingEmail: 'all',
      marketingSms: 'all',
    };
    setFilters(defaultFilters);
    setLoading(true);
    fetchUsers();
  };

  const handleUserSelect = (userId: string) => {
    setSelectedUserId(userId);
    setDetailModalOpen(true);
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      // DB 연결 해제 - 로컬 상태만 업데이트
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
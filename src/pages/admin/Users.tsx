import { useState, useEffect } from 'react';
import { AdminLayout } from '@/layouts/AdminLayout';
import { useToast } from '@/hooks/use-toast';
import { UserSummaryDashboard } from '@/components/admin/UserSummaryDashboard';
import { UserSearchFilter, type UserFilters } from '@/components/admin/UserSearchFilter';
import { UserListTable, type UserData } from '@/components/admin/UserListTable';
import { UserDetailModal } from '@/components/admin/UserDetailModal';

export const AdminUsers = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [filters, setFilters] = useState<UserFilters>({
    searchTerm: '',
    status: 'all',
    userGrade: 'all',
    enrolledCourse: 'all',
    marketingEmail: 'all',
    marketingSms: 'all',
  });
  const { toast } = useToast();

  // Mock 사용자 데이터
  const mockUsers: UserData[] = [
    {
      id: '1',
      memberId: 'USR240001',
      name: '김영희',
      email: 'kim.younghee@example.com',
      phone: '010-1234-5678',
      joinDate: '2024-01-15T10:30:00Z',
      lastLogin: '2024-03-20T14:22:00Z',
      totalPayment: 340000,
      status: 'active',
      grade: 'vip',
      marketingEmail: true,
      marketingSms: false
    },
    {
      id: '2',
      memberId: 'USR240002',
      name: '이철수',
      email: 'lee.chulsoo@example.com',
      phone: '010-2345-6789',
      joinDate: '2023-11-08T09:15:00Z',
      lastLogin: '2024-03-19T16:45:00Z',
      totalPayment: 180000,
      status: 'active',
      grade: 'instructor',
      marketingEmail: true,
      marketingSms: true
    },
    {
      id: '3',
      memberId: 'USR240003',
      name: '박민지',
      email: 'park.minji@example.com',
      phone: '010-3456-7890',
      joinDate: '2024-02-20T11:00:00Z',
      lastLogin: '2024-03-18T09:30:00Z',
      totalPayment: 89000,
      status: 'active',
      grade: 'general',
      marketingEmail: false,
      marketingSms: false
    },
    {
      id: '4',
      memberId: 'USR240004',
      name: '정수연',
      email: 'jung.suyeon@example.com',
      phone: '010-4567-8901',
      joinDate: '2023-08-12T08:45:00Z',
      lastLogin: '2024-02-15T14:20:00Z',
      totalPayment: 520000,
      status: 'dormant',
      grade: 'vip',
      marketingEmail: true,
      marketingSms: false
    },
    {
      id: '5',
      memberId: 'USR240005',
      name: '한지민',
      email: 'han.jimin@example.com',
      phone: '010-5678-9012',
      joinDate: '2024-03-01T13:20:00Z',
      lastLogin: '2024-03-05T15:10:00Z',
      totalPayment: 0,
      status: 'suspended',
      grade: 'general',
      marketingEmail: false,
      marketingSms: false
    }
  ];

  useEffect(() => {
    fetchUsers();
  }, [filters]);

  const fetchUsers = async () => {
    setLoading(true);
    
    // Mock API 딜레이
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // 필터 적용
    let filteredUsers = mockUsers;

    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      filteredUsers = filteredUsers.filter(user => 
        user.name.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term) ||
        user.memberId.toLowerCase().includes(term) ||
        (user.phone && user.phone.includes(term))
      );
    }

    if (filters.status !== 'all') {
      filteredUsers = filteredUsers.filter(user => user.status === filters.status);
    }

    if (filters.userGrade !== 'all') {
      filteredUsers = filteredUsers.filter(user => user.grade === filters.userGrade);
    }

    if (filters.marketingEmail !== 'all') {
      const emailConsent = filters.marketingEmail === 'true';
      filteredUsers = filteredUsers.filter(user => user.marketingEmail === emailConsent);
    }

    if (filters.marketingSms !== 'all') {
      const smsConsent = filters.marketingSms === 'true';
      filteredUsers = filteredUsers.filter(user => user.marketingSms === smsConsent);
    }

    if (filters.joinDateStart) {
      filteredUsers = filteredUsers.filter(user => 
        new Date(user.joinDate) >= filters.joinDateStart!
      );
    }

    if (filters.joinDateEnd) {
      filteredUsers = filteredUsers.filter(user => 
        new Date(user.joinDate) <= filters.joinDateEnd!
      );
    }

    if (filters.lastLoginStart && filters.lastLoginEnd) {
      filteredUsers = filteredUsers.filter(user => {
        if (!user.lastLogin) return false;
        const lastLogin = new Date(user.lastLogin);
        return lastLogin >= filters.lastLoginStart! && lastLogin <= filters.lastLoginEnd!;
      });
    }

    setUsers(filteredUsers);
    setLoading(false);
  };

  const handleFiltersChange = (newFilters: UserFilters) => {
    setFilters(newFilters);
  };

  const handleResetFilters = () => {
    const defaultFilters: UserFilters = {
      searchTerm: '',
      status: 'all',
      userGrade: 'all',
      enrolledCourse: 'all',
      marketingEmail: 'all',
      marketingSms: 'all',
    };
    setFilters(defaultFilters);
  };

  const handleUserSelect = (userId: string) => {
    setSelectedUserId(userId);
    setDetailModalOpen(true);
  };

  const handleBulkAction = async (action: string, userIds: string[]) => {
    switch (action) {
      case 'message':
        toast({
          title: "메시지 발송",
          description: `선택된 ${userIds.length}명의 사용자에게 메시지를 발송했습니다.`
        });
        break;
      case 'export':
        exportToCSV(userIds);
        break;
      case 'status_change':
        toast({
          title: "상태 변경",
          description: `선택된 ${userIds.length}명의 사용자 상태를 변경했습니다.`
        });
        break;
      default:
        toast({
          title: "기능 준비 중",
          description: "해당 기능은 추후 구현 예정입니다."
        });
    }
  };

  const handleStatusChange = async (userId: string, newStatus: string) => {
    try {
      // Mock API 호출
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setUsers(users.map(user => 
        user.id === userId ? { ...user, status: newStatus as any } : user
      ));

      toast({
        title: "상태 변경 완료",
        description: "사용자 상태가 성공적으로 변경되었습니다."
      });
    } catch (error) {
      toast({
        title: "상태 변경 실패",
        description: "사용자 상태 변경에 실패했습니다.",
        variant: "destructive"
      });
    }
  };

  const exportToCSV = (userIds: string[]) => {
    const selectedUsers = users.filter(user => userIds.includes(user.id));
    const csvContent = [
      ['회원ID', '이름', '이메일', '연락처', '등급', '가입일', '최근접속일', '총결제금액', '상태'].join(','),
      ...selectedUsers.map(user => [
        user.memberId,
        user.name,
        user.email,
        user.phone || '',
        user.grade,
        new Date(user.joinDate).toLocaleDateString(),
        user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : '',
        user.totalPayment,
        user.status
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
      description: "사용자 목록이 CSV 파일로 내보내졌습니다."
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* 페이지 헤더 */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">사용자 관리</h1>
        </div>

        {/* 요약 대시보드 */}
        <UserSummaryDashboard />

        {/* 검색 및 필터링 영역 */}
        <UserSearchFilter
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onReset={handleResetFilters}
        />

        {/* 사용자 목록 테이블 */}
        <UserListTable
          users={users}
          loading={loading}
          onUserSelect={handleUserSelect}
          onBulkAction={handleBulkAction}
          onStatusChange={handleStatusChange}
        />

        {/* 사용자 상세 정보 모달 */}
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

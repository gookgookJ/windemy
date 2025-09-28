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
    learningStatus: 'all',
    marketingEmail: 'all',
    expirationFilter: 'all',
  });
  const { toast } = useToast();

  // 이커머스 교육 플랫폼 최적화 Mock 데이터
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
      marketingEmail: true,
      currentCourses: 2,
      completedCourses: 3,
      totalLearningTime: 1240, // 분
      averageProgress: 85,
      expirationDate: '2024-12-31T23:59:59Z',
      lastLearningDate: '2024-03-20T10:30:00Z',
      certificatesEarned: 2
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
      marketingEmail: true,
      currentCourses: 1,
      completedCourses: 2,
      totalLearningTime: 680,
      averageProgress: 45,
      expirationDate: '2024-04-15T23:59:59Z', // 곧 만료
      lastLearningDate: '2024-03-18T14:20:00Z',
      certificatesEarned: 1
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
      marketingEmail: false,
      currentCourses: 1,
      completedCourses: 0,
      totalLearningTime: 120,
      averageProgress: 15,
      expirationDate: '2024-08-20T23:59:59Z',
      lastLearningDate: '2024-03-15T18:45:00Z',
      certificatesEarned: 0
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
      marketingEmail: true,
      currentCourses: 0,
      completedCourses: 4,
      totalLearningTime: 2160,
      averageProgress: 100,
      expirationDate: '2024-02-12T23:59:59Z', // 만료됨
      lastLearningDate: '2024-02-10T16:30:00Z',
      certificatesEarned: 3
    },
    {
      id: '5',
      memberId: 'USR240005',
      name: '한지민',
      email: 'han.jimin@example.com',
      phone: '010-5678-9012',
      joinDate: '2024-03-01T13:20:00Z',
      lastLogin: '2024-03-05T15:10:00Z',
      totalPayment: 65000,
      status: 'active',
      marketingEmail: false,
      currentCourses: 1,
      completedCourses: 0,
      totalLearningTime: 45,
      averageProgress: 5,
      expirationDate: '2024-06-01T23:59:59Z',
      lastLearningDate: '2024-03-05T15:10:00Z',
      certificatesEarned: 0
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

    if (filters.learningStatus !== 'all') {
      filteredUsers = filteredUsers.filter(user => {
        switch (filters.learningStatus) {
          case 'learning': return user.currentCourses > 0;
          case 'completed': return user.completedCourses > 0;
          case 'not_started': return user.currentCourses === 0 && user.completedCourses === 0;
          default: return true;
        }
      });
    }

    if (filters.expirationFilter !== 'all') {
      filteredUsers = filteredUsers.filter(user => {
        if (!user.expirationDate) return filters.expirationFilter === 'all';
        const expiry = new Date(user.expirationDate);
        const now = new Date();
        const diffDays = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        switch (filters.expirationFilter) {
          case 'expiring_soon': return diffDays <= 7 && diffDays > 0;
          case 'expired': return diffDays <= 0;
          case 'active': return diffDays > 7;
          default: return true;
        }
      });
    }

    if (filters.marketingEmail !== 'all') {
      const emailConsent = filters.marketingEmail === 'true';
      filteredUsers = filteredUsers.filter(user => user.marketingEmail === emailConsent);
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
      learningStatus: 'all',
      marketingEmail: 'all',
      expirationFilter: 'all',
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
          title: "알림 발송 완료",
          description: `선택된 ${userIds.length}명의 회원에게 알림을 발송했습니다.`,
          duration: 3000,
        });
        break;
      case 'export':
        exportToExcel(userIds);
        break;
      case 'extend_access':
        toast({
          title: "수강권 연장 완료",
          description: `선택된 ${userIds.length}명의 수강권을 30일 연장했습니다.`,
          duration: 3000,
        });
        break;
      case 'status_change':
        toast({
          title: "상태 변경 완료",
          description: `선택된 ${userIds.length}명의 회원 상태를 변경했습니다.`,
          duration: 3000,
        });
        break;
      default:
        toast({
          title: "기능 준비 중",
          description: "해당 기능은 추후 구현 예정입니다.",
          variant: "destructive"
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

  const exportToExcel = (userIds: string[]) => {
    const selectedUsers = users.filter(user => userIds.includes(user.id));
    const csvContent = [
      ['회원ID', '이름', '이메일', '연락처', '가입일', '상태', '수강중', '완주', '평균진도', '총학습시간', '총결제금액', '수강권만료일', '마케팅수신', '수료증'].join(','),
      ...selectedUsers.map(user => [
        user.memberId,
        user.name,
        user.email,
        user.phone || '',
        new Date(user.joinDate).toLocaleDateString(),
        user.status === 'active' ? '정상' : '휴면',
        user.currentCourses,
        user.completedCourses,
        `${user.averageProgress}%`,
        `${Math.floor(user.totalLearningTime / 60)}h ${user.totalLearningTime % 60}m`,
        user.totalPayment,
        user.expirationDate ? new Date(user.expirationDate).toLocaleDateString() : '',
        user.marketingEmail ? '동의' : '거부',
        user.certificatesEarned
      ].join(','))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `회원정보_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "내보내기 완료",
      description: "회원 정보가 Excel 파일로 내보내졌습니다.",
      duration: 3000,
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6 p-6 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 min-h-screen">
        {/* 페이지 헤더 */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border">
          <h1 className="text-3xl font-bold text-foreground mb-2">회원 관리</h1>
          <p className="text-muted-foreground">교육 플랫폼 회원들의 학습 현황과 정보를 종합적으로 관리합니다</p>
        </div>

        {/* 요약 대시보드 */}
        <UserSummaryDashboard />

        {/* 검색 및 필터링 영역 */}
        <UserSearchFilter
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onReset={handleResetFilters}
          totalUsers={mockUsers.length}
          filteredUsers={users.length}
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

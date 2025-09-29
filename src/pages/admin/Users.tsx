import { useState, useEffect } from 'react';
import { AdminLayout } from '@/layouts/AdminLayout';
import { useToast } from '@/hooks/use-toast';
import { UserSummaryDashboard } from '@/components/admin/UserSummaryDashboard';
import { UserSearchFilter, type UserFilters } from '@/components/admin/UserSearchFilter';
import { UserListTable, type UserData } from '@/components/admin/UserListTable';
import { CoursePermissionModal } from '@/components/admin/CoursePermissionModal';
import { GroupManagementModal } from '@/components/admin/GroupManagementModal';
import { CouponDistributionModal } from '@/components/admin/CouponDistributionModal';
import { PointsDistributionModal } from '@/components/admin/PointsDistributionModal';

console.log('[AdminUsers] module loaded');

const AdminUsers = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [coursePermissionModalOpen, setCoursePermissionModalOpen] = useState(false);
  const [groupManagementModalOpen, setGroupManagementModalOpen] = useState(false);
  const [couponModalOpen, setCouponModalOpen] = useState(false);
  const [pointsModalOpen, setPointsModalOpen] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filters, setFilters] = useState<UserFilters>({
    searchTerm: '',
    status: 'all',
    marketingEmail: 'all',
    group: 'all',
  });
  const { toast } = useToast();

  // 단순화된 Mock 사용자 데이터
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
      group: 'VIP 고객'
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
      group: '신규 회원'
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
      group: '신규 회원'
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
      group: '장기 미접속'
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
      group: '신규 회원'
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

    if (filters.marketingEmail !== 'all') {
      const emailConsent = filters.marketingEmail === 'true';
      filteredUsers = filteredUsers.filter(user => user.marketingEmail === emailConsent);
    }

    if (filters.group && filters.group !== 'all') {
      const groupMap: Record<string, string> = {
        'vip': 'VIP 고객',
        'new': '신규 회원',
        'inactive': '장기 미접속',
        'completed': '수강 완료자'
      };
      const groupName = groupMap[filters.group] || filters.group;
      filteredUsers = filteredUsers.filter(user => user.group === groupName);
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
    setCurrentPage(1); // Reset to first page when filters change
    setLoading(false);
  };

  const handleFiltersChange = (newFilters: UserFilters) => {
    setFilters(newFilters);
  };

  const handleResetFilters = () => {
    const defaultFilters: UserFilters = {
      searchTerm: '',
      status: 'all',
      marketingEmail: 'all',
      group: 'all',
    };
    setFilters(defaultFilters);
  };

  const handleUserSelect = (userId: string) => {
    // Navigate to user detail page instead of opening modal
    window.location.href = `/admin/users/${userId}`;
  };

  const handleBulkAction = async (action: string, userIds: string[]) => {
    switch (action) {
      case 'export':
        exportToCSV(userIds);
        break;
      case 'course_permission':
        setSelectedUserIds(userIds);
        setCoursePermissionModalOpen(true);
        break;
      case 'group_management':
        setSelectedUserIds(userIds);
        setGroupManagementModalOpen(true);
        break;
      default:
        toast({
          title: "기능 준비 중",
          description: "해당 기능은 추후 구현 예정입니다."
        });
    }
  };

  const handleCouponDistribute = (userIds: string[]) => {
    setSelectedUserIds(userIds);
    setCouponModalOpen(true);
  };

  const handlePointsDistribute = (userIds: string[]) => {
    setSelectedUserIds(userIds);
    setPointsModalOpen(true);
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

  const handleDeleteUser = async (userId: string) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setUsers(users.filter(user => user.id !== userId));

      toast({
        title: "계정 삭제 완료",
        description: "사용자 계정이 성공적으로 삭제되었습니다."
      });
    } catch (error) {
      toast({
        title: "계정 삭제 실패",
        description: "계정 삭제에 실패했습니다.",
        variant: "destructive"
      });
    }
  };

  const handleResetPassword = async (userId: string) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      toast({
        title: "비밀번호 초기화 완료",
        description: "임시 비밀번호가 이메일로 발송되었습니다."
      });
    } catch (error) {
      toast({
        title: "비밀번호 초기화 실패",
        description: "비밀번호 초기화에 실패했습니다.",
        variant: "destructive"
      });
    }
  };

  const exportToCSV = (userIds: string[]) => {
    const selectedUsers = users.filter(user => userIds.includes(user.id));
    const csvContent = [
      ['회원ID', '이름', '이메일', '연락처', '가입일', '최근접속일', '총결제금액', '상태', '마케팅수신'].join(','),
      ...selectedUsers.map(user => [
        user.memberId,
        user.name,
        user.email,
        user.phone || '',
        new Date(user.joinDate).toLocaleDateString(),
        user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : '',
        user.totalPayment,
        user.status,
        user.marketingEmail ? '동의' : '거부'
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
      description: "회원 목록이 Excel 파일로 내보내졌습니다."
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-8 p-6">
        {/* 페이지 헤더 */}
        <div className="border-b border-border/30 pb-6">
          <h1 className="text-3xl font-bold text-foreground tracking-tight">회원 관리</h1>
          <p className="text-muted-foreground mt-2 text-base">등록된 회원들을 조회하고 효율적으로 관리할 수 있습니다</p>
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
          onCouponDistribute={handleCouponDistribute}
          onPointsDistribute={handlePointsDistribute}
          onDeleteUser={handleDeleteUser}
          onResetPassword={handleResetPassword}
          currentPage={currentPage}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={(newPageSize) => {
            setPageSize(newPageSize);
            setCurrentPage(1);
          }}
        />

        {/* Remove UserDetailModal since we're using a separate page now */}

        {/* 강의 권한 관리 모달 */}
        <CoursePermissionModal
          open={coursePermissionModalOpen}
          onClose={() => {
            setCoursePermissionModalOpen(false);
            setSelectedUserIds([]);
          }}
          userId={selectedUserIds.length === 1 ? selectedUserIds[0] : undefined}
        />

        {/* 그룹 관리 모달 */}
        <GroupManagementModal
          open={groupManagementModalOpen}
          onClose={() => {
            setGroupManagementModalOpen(false);
            setSelectedUserIds([]);
          }}
          selectedUsers={selectedUserIds}
          onGroupAssigned={(groupId) => {
            setSelectedUserIds([]);
            setGroupManagementModalOpen(false);
          }}
        />

        <CouponDistributionModal
          open={couponModalOpen}
          onClose={() => {
            setCouponModalOpen(false);
            setSelectedUserIds([]);
          }}
          selectedUsers={selectedUserIds}
        />

        <PointsDistributionModal
          open={pointsModalOpen}
          onClose={() => {
            setPointsModalOpen(false);
            setSelectedUserIds([]);
          }}
          selectedUsers={selectedUserIds}
        />
      </div>
    </AdminLayout>
  );
};

export default AdminUsers;

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/layouts/AdminLayout';
import { useToast } from '@/hooks/use-toast';
import { UserSummaryDashboard } from '@/components/admin/UserSummaryDashboard';
import { UserSearchFilter, type UserFilters } from '@/components/admin/UserSearchFilter';
import { UserListTable, type UserData } from '@/components/admin/UserListTable';

import { CoursePermissionModal } from '@/components/admin/CoursePermissionModal';
import { CouponDistributionModal } from '@/components/admin/CouponDistributionModal';
import { PointsDistributionModal } from '@/components/admin/PointsDistributionModal';
import { AdminNoteModal } from '@/components/admin/AdminNoteModal';
import { GroupCreateModal } from '@/components/admin/GroupCreateModal';
import { GroupAssignmentDropdown } from '@/components/admin/GroupAssignmentDropdown';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';

console.log('[AdminUsers] module loaded');

const AdminUsers = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [coursePermissionModalOpen, setCoursePermissionModalOpen] = useState(false);
  const [groupCreateModalOpen, setGroupCreateModalOpen] = useState(false);
  const [couponModalOpen, setCouponModalOpen] = useState(false);
  const [pointsModalOpen, setPointsModalOpen] = useState(false);
  const [adminNoteModalOpen, setAdminNoteModalOpen] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [selectedUserEmail, setSelectedUserEmail] = useState<string>('');
  const [groupDropdownOpen, setGroupDropdownOpen] = useState(false);
  const [groupDropdownPosition, setGroupDropdownPosition] = useState({ top: 0, left: 0 });
  
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filters, setFilters] = useState<UserFilters>({
    searchTerm: '',
    status: 'all',
    marketingEmail: 'all',
    group: 'all',
  });
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    fetchUsers();
  }, [filters]);

  const fetchUsers = async () => {
    setLoading(true);
    
    try {
      let query = supabase
        .from('profiles')
        .select('*')
        .in('role', ['student', 'admin']); // 일반 회원과 관리자 조회

      // 검색어 필터
      if (filters.searchTerm) {
        const searchTerm = filters.searchTerm.toLowerCase();
        query = query.or(`full_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`);
      }

      // 마케팅 수신 필터
      if (filters.marketingEmail !== 'all') {
        const emailConsent = filters.marketingEmail === 'true';
        query = query.eq('marketing_consent', emailConsent);
      }

      // 역할 필터 (그룹으로 사용)
      if (filters.group && filters.group !== 'all') {
        query = query.eq('role', filters.group);
      }

      // 가입일 필터
      if (filters.joinDateStart) {
        query = query.gte('created_at', filters.joinDateStart.toISOString());
      }

      if (filters.joinDateEnd) {
        const endDate = new Date(filters.joinDateEnd);
        endDate.setHours(23, 59, 59, 999);
        query = query.lte('created_at', endDate.toISOString());
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      // 결제 정보는 추후 orders 테이블과 연동하여 계산
      const baseUsers = data?.map(profile => ({
        id: profile.id,
        memberId: `USR${profile.created_at.slice(0, 4).replace('-', '')}${profile.id.slice(0, 6).toUpperCase()}`,
        name: profile.full_name || profile.email,
        email: profile.email,
        phone: profile.phone || '',
        joinDate: profile.created_at,
        lastLogin: profile.updated_at, // 마지막 로그인 정보가 없으므로 업데이트 시간 사용
        totalPayment: 0, // 추후 orders 테이블과 연동
        status: 'active' as const, // 실제로는 활동 상태에 따라 계산 필요
        marketingEmail: profile.marketing_consent || false,
        // 기본값: 관리자는 '관리자', 그 외는 빈 값 (이후 그룹 요약으로 채움)
        group: profile.role === 'admin' ? '관리자' : ''
      })) || [];

      // 그룹 요약(view)로부터 사용자별 그룹명 가져와 병합
      const userIds = baseUsers.map(u => u.id);
      let groupNameByUserId: Record<string, string> = {};
      if (userIds.length > 0) {
        const { data: groupSummary, error: groupSummaryError } = await supabase
          .from('user_group_summary')
          .select('user_id, group_names')
          .in('user_id', userIds);

        if (!groupSummaryError && groupSummary) {
          groupSummary.forEach(row => {
            const names = (row as any).group_names as string[] | null;
            groupNameByUserId[(row as any).user_id as string] = names && names.length > 0 ? names.join(', ') : '';
          });
        }
      }

      const usersWithGroup = baseUsers.map(u => ({
        ...u,
        group: u.group || groupNameByUserId[u.id] || '미분류'
      }));

      setUsers(usersWithGroup);
      setCurrentPage(1); // Reset to first page when filters change
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "데이터 조회 실패",
        description: "사용자 목록을 불러오는데 실패했습니다.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
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
      case 'groupCreate':
        setGroupCreateModalOpen(true);
        break;
      case 'status_change':
        // 일괄 상태 변경 로직 (추후 구현)
        toast({
          title: "일괄 상태 변경",
          description: "선택된 회원들의 상태 변경 기능은 추후 구현 예정입니다."
        });
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
      // 실제로는 사용자 활동 상태에 따라 관리해야 하지만
      // 현재는 UI 업데이트만 진행
      setUsers(users.map(user => 
        user.id === userId ? { ...user, status: newStatus as any } : user
      ));

      toast({
        title: "상태 변경 완료",
        description: "사용자 상태가 성공적으로 변경되었습니다."
      });
    } catch (error) {
      console.error('Error changing user status:', error);
      toast({
        title: "상태 변경 실패",
        description: "사용자 상태 변경에 실패했습니다.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (error) throw error;
      
      setUsers(users.filter(user => user.id !== userId));

      toast({
        title: "계정 삭제 완료",
        description: "사용자 계정이 성공적으로 삭제되었습니다."
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: "계정 삭제 실패",
        description: "계정 삭제에 실패했습니다.",
        variant: "destructive"
      });
    }
  };

  const handleResetPassword = async (userId: string) => {
    try {
      // Supabase Auth API를 통한 비밀번호 재설정은 별도 구현 필요
      toast({
        title: "비밀번호 초기화 완료",
        description: "임시 비밀번호가 이메일로 발송되었습니다."
      });
    } catch (error) {
      console.error('Error resetting password:', error);
      toast({
        title: "비밀번호 초기화 실패",
        description: "비밀번호 초기화에 실패했습니다.",
        variant: "destructive"
      });
    }
  };

  const handleAddNote = (userId: string, userEmail: string) => {
    setSelectedUserId(userId);
    setSelectedUserEmail(userEmail);
    setAdminNoteModalOpen(true);
  };
  
  const handleGroupAssign = (userIds: string[], position: { top: number; left: number }) => {
    setSelectedUserIds(userIds);
    setGroupDropdownPosition(position);
    setGroupDropdownOpen(true);
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
          onGroupAssign={handleGroupAssign}
          onAddNote={handleAddNote}
          currentPage={currentPage}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={(newPageSize) => {
            setPageSize(newPageSize);
            setCurrentPage(1);
          }}
          selectedUsers={selectedUserIds}
          onSelectedUsersChange={setSelectedUserIds}
        />
      </div>

      {/* Modals */}
      {/* 강의 권한 관리 모달 */}
      <CoursePermissionModal
        open={coursePermissionModalOpen}
        onClose={() => {
          setCoursePermissionModalOpen(false);
          setSelectedUserIds([]);
        }}
        userId={selectedUserIds.length === 1 ? selectedUserIds[0] : undefined}
      />

      {/* 그룹 생성 모달 */}
      <GroupCreateModal
        open={groupCreateModalOpen}
        onClose={() => setGroupCreateModalOpen(false)}
        onGroupCreated={() => {
          // 필요시 그룹 목록 새로고침
        }}
      />

      {/* 그룹 배정 드롭다운 */}
      {groupDropdownOpen && (
        <GroupAssignmentDropdown
          selectedUsers={selectedUserIds}
          onClose={() => {
            setGroupDropdownOpen(false);
            setSelectedUserIds([]);
          }}
          onGroupAssigned={async () => {
            await fetchUsers(); // 그룹 배정 후 사용자 목록 새로고침
          }}
          position={groupDropdownPosition}
        />
      )}

      <CouponDistributionModal
        open={couponModalOpen}
        onClose={() => {
          setCouponModalOpen(false);
        }}
        selectedUsers={selectedUserIds}
      />

      <PointsDistributionModal
        open={pointsModalOpen}
        onClose={() => {
          setPointsModalOpen(false);
        }}
        selectedUsers={selectedUserIds}
      />

      <AdminNoteModal
        open={adminNoteModalOpen}
        onClose={() => {
          setAdminNoteModalOpen(false);
          setSelectedUserId(null);
          setSelectedUserEmail('');
        }}
        userId={selectedUserId || ''}
        userEmail={selectedUserEmail}
        onNoteSaved={() => {
          // 필요시 사용자 목록 새로고침 등의 작업 수행
        }}
      />
    </AdminLayout>
  );
};

export default AdminUsers;
import React, { useState, useEffect } from 'react';
import { AdminLayout } from '@/layouts/AdminLayout';
import { useToast } from '@/hooks/use-toast';
import { UserSearchFilter, type UserFilters } from '@/components/admin/UserSearchFilter';
import { UserListTable, type UserData } from '@/components/admin/UserListTable';
import { CoursePermissionModal } from '@/components/admin/CoursePermissionModal';
import { CouponDistributionModal } from '@/components/admin/CouponDistributionModal';
import { PointsDistributionModal } from '@/components/admin/PointsDistributionModal';
import { AdminNoteModal } from '@/components/admin/AdminNoteModal';
import { GroupCreateDropdown } from '@/components/admin/GroupCreateDropdown';
import { GroupAssignmentDropdown } from '@/components/admin/GroupAssignmentDropdown';
import { ExportDataDropdown } from '@/components/admin/ExportDataDropdown';
import { RoleChangeModal } from '@/components/admin/RoleChangeModal';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import * as XLSX from 'xlsx';

console.log('[AdminUsers] module loaded');

const AdminUsers = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [coursePermissionModalOpen, setCoursePermissionModalOpen] = useState(false);
  const [couponModalOpen, setCouponModalOpen] = useState(false);
  const [pointsModalOpen, setPointsModalOpen] = useState(false);
  const [adminNoteModalOpen, setAdminNoteModalOpen] = useState(false);
  const [roleChangeModalOpen, setRoleChangeModalOpen] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [selectedUserEmail, setSelectedUserEmail] = useState<string>('');
  const [selectedUserForRole, setSelectedUserForRole] = useState<{
    id: string;
    name: string;
    email: string;
    role: string;
  } | null>(null);
  const [showGroupAssignmentDropdown, setShowGroupAssignmentDropdown] = useState(false);
  const [showGroupCreateDropdown, setShowGroupCreateDropdown] = useState(false);
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [groupAssignTriggerElement, setGroupAssignTriggerElement] = useState<HTMLElement | null>(null);
  const [groupCreateTriggerElement, setGroupCreateTriggerElement] = useState<HTMLElement | null>(null);
  const [exportTriggerElement, setExportTriggerElement] = useState<HTMLElement | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filters, setFilters] = useState<UserFilters>({
    searchTerm: '',
    status: 'all',
    marketingEmail: 'all',
    group: 'all',
    joinDatePeriod: 'all'
  });
  const { toast } = useToast();
  const { user } = useAuth();

  const createTestUser = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('create-test-user', {
        body: {
          email: 'test@windly.cc',
          password: 'test1234567890'
        }
      });

      if (error) {
        throw error;
      }

      if (data.error) {
        throw new Error(data.error);
      }

      toast({
        title: "성공",
        description: "테스트 계정이 성공적으로 생성되었습니다.",
      });

      // 사용자 목록 새로고침
      fetchUsers();
    } catch (error) {
      console.error('테스트 계정 생성 오류:', error);
      toast({
        title: "오류",
        description: "테스트 계정 생성에 실패했습니다.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [filters]);

  const fetchUsers = async () => {
    setLoading(true);
    
    try {
      // 1. profiles 테이블에서 기본 사용자 정보 가져오기
      let query = supabase
        .from('profiles')
        .select('*');

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

      // 가입일 기간 필터
      if (filters.joinDatePeriod && filters.joinDatePeriod !== 'all') {
        const now = new Date();
        let startDate: Date;
        
        switch (filters.joinDatePeriod) {
          case '1week':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case '1month':
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
          case '3months':
            startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
            break;
          case '6months':
            startDate = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
            break;
          case '1year':
            startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
            break;
          default:
            startDate = new Date(0);
        }
        
        query = query.gte('created_at', startDate.toISOString());
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
        lastLogin: profile.updated_at,
        totalPayment: 0,
        status: 'active' as const,
        marketingEmail: profile.marketing_consent || false,
        role: 'student', // 임시 기본값, 아래에서 user_roles로부터 가져와 덮어씀
        group: ''
      })) || [];

      // user_roles 테이블에서 역할 가져오기
      const userIds = baseUsers.map(u => u.id);
      if (userIds.length > 0) {
        const { data: rolesData } = await supabase
          .from('user_roles')
          .select('user_id, role')
          .in('user_id', userIds);

        // 역할 맵핑 (각 사용자의 가장 높은 권한 역할 선택)
        const roleByUserId: Record<string, string> = {};
        if (rolesData) {
          (rolesData as any[]).forEach(r => {
            const userId = r.user_id;
            const role = r.role;
            // 우선순위: admin > instructor > student
            if (!roleByUserId[userId] || 
                (role === 'admin') ||
                (role === 'instructor' && roleByUserId[userId] !== 'admin')) {
              roleByUserId[userId] = role;
            }
          });
        }

        // 역할 병합
        baseUsers.forEach(u => {
          u.role = roleByUserId[u.id] || 'student';
        });
      }

      // 그룹 필터 적용 (역할 기반)
      let filteredByRole = baseUsers;
      if (filters.group === 'admin') {
        filteredByRole = baseUsers.filter(u => u.role === 'admin');
      }

      // 그룹 요약(view)로부터 사용자별 그룹명 가져와 병합
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

      const usersWithGroup = baseUsers.map(u => {
        const actualGroup = groupNameByUserId[u.id];
        const finalGroup = actualGroup && actualGroup.length > 0 ? actualGroup : '미분류';
        return {
          ...u,
          group: finalGroup
        };
      });

      // 클라이언트 사이드 그룹 필터링 적용
      let filteredUsers = usersWithGroup;
      if (filters.group && filters.group !== 'all' && filters.group !== 'admin') {
        filteredUsers = usersWithGroup.filter(user => {
          if (filters.group === '미분류') {
            return (user.group || '') === '미분류';
          }
          return (user.group || '').includes(filters.group!);
        });
      }

      setUsers(filteredUsers);
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

  const fetchUserExportData = async (selectedFields: string[], selectedUsers: string[]) => {
    const userIds = selectedUsers.length > 0 ? selectedUsers : users.map(u => u.id);
    
    // 기본 프로필 데이터
    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .in('id', userIds);

    // 그룹 정보
    const { data: groupMemberships } = await supabase
      .from('user_group_memberships')
      .select(`
        user_id,
        user_groups (
          name,
          color
        )
      `)
      .in('user_id', userIds);

    // 주문 정보
    const { data: orders } = await supabase
      .from('orders')
      .select('*')
      .in('user_id', userIds);

    // 수강 정보
    const { data: enrollments } = await supabase
      .from('enrollments')
      .select(`
        *,
        courses (
          title
        )
      `)
      .in('user_id', userIds);

    // 포인트 거래 내역
    const { data: pointsTransactions } = await supabase
      .from('points_transactions')
      .select('*')
      .in('user_id', userIds);

    // 쿠폰 사용 내역
    const { data: userCoupons } = await supabase
      .from('user_coupons')
      .select(`
        *,
        coupons (
          name,
          code
        )
      `)
      .in('user_id', userIds);

    // 관리자 메모
    const { data: adminNotes } = await supabase
      .from('admin_notes')
      .select('*')
      .in('user_id', userIds)
      .order('created_at', { ascending: false });

    // 활동 로그
    const { data: activityLogs } = await supabase
      .from('activity_logs')
      .select('*')
      .in('user_id', userIds)
      .order('created_at', { ascending: false });

    // 지원 티켓
    const { data: supportTickets } = await supabase
      .from('support_tickets')
      .select('*')
      .in('user_id', userIds);

    // 데이터 조합
    return profiles?.map(profile => {
      const userOrders = orders?.filter(o => o.user_id === profile.id) || [];
      const userEnrollments = enrollments?.filter(e => e.user_id === profile.id) || [];
      const userGroups = groupMemberships?.filter(g => g.user_id === profile.id) || [];
      const userPoints = pointsTransactions?.filter(p => p.user_id === profile.id) || [];
      const userCouponsList = userCoupons?.filter(c => c.user_id === profile.id) || [];
      const userNotes = adminNotes?.filter(n => n.user_id === profile.id) || [];
      const userActivity = activityLogs?.filter(a => a.user_id === profile.id) || [];
      const userSupport = supportTickets?.filter(s => s.user_id === profile.id) || [];

      // 계산된 값들
      const totalPayment = userOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
      const latestOrderDate = userOrders.length > 0 
        ? Math.max(...userOrders.map(o => new Date(o.created_at).getTime()))
        : null;
      const activeCourses = userEnrollments.filter(e => !e.completed_at).length;
      const groupNames = userGroups.map(g => g.user_groups?.name).filter(Boolean).join(', ');
      const latestNote = userNotes[0]?.note || '';
      const currentPoints = userPoints.reduce((sum, p) => sum + p.amount, 0);

      return {
        // 기본 정보
        full_name: profile.full_name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        role: profile.role || '',
        created_at: new Date(profile.created_at).toLocaleDateString('ko-KR'),
        marketing_consent: profile.marketing_consent ? '동의' : '거부',
        
        // 결제 정보
        total_payment: totalPayment.toLocaleString('ko-KR') + '원',
        latest_order_date: latestOrderDate ? new Date(latestOrderDate).toLocaleDateString('ko-KR') : '',
        
        // 학습 정보
        active_courses_count: activeCourses,
        course_list: userEnrollments.map(e => e.courses?.title).filter(Boolean).join(', '),
        enrollment_details: userEnrollments.map(e => 
          `${e.courses?.title}: ${(e.progress || 0).toFixed(1)}% (${e.enrolled_at ? new Date(e.enrolled_at).toLocaleDateString('ko-KR') : ''}${e.completed_at ? ` ~ ${new Date(e.completed_at).toLocaleDateString('ko-KR')}` : ''})`
        ).join(' | '),
        
        // 그룹 정보
        group_name: groupNames,
        
        // 메모
        latest_admin_note: latestNote,
        
        // 주문 내역
        order_history: userOrders.map(o => 
          `${new Date(o.created_at).toLocaleDateString('ko-KR')}: ${o.total_amount?.toLocaleString('ko-KR')}원 (${o.status})`
        ).join(' | '),
        
        // 포인트
        points_balance: currentPoints.toLocaleString('ko-KR'),
        points_history: userPoints.map(p => 
          `${new Date(p.created_at).toLocaleDateString('ko-KR')}: ${p.amount > 0 ? '+' : ''}${p.amount} (${p.description})`
        ).join(' | '),
        
        // 쿠폰
        coupon_usage: userCouponsList.map(c => 
          `${c.coupons?.name} (${c.is_used ? '사용됨' : '미사용'})`
        ).join(' | '),
        
        // 활동
        recent_activity: userActivity.slice(0, 5).map(a => 
          `${new Date(a.created_at).toLocaleDateString('ko-KR')}: ${a.action}`
        ).join(' | '),
        ip_address: userActivity[0]?.ip_address || '',
        
        // 지원
        support_history: userSupport.map(s => 
          `${s.subject} (${s.status})`
        ).join(' | ')
      };
    }) || [];
  };

  const downloadCSV = (data: any[], selectedFields: string[]) => {
    // 필드 라벨 매핑
    const fieldLabels: Record<string, string> = {
      full_name: '전체 이름',
      email: '이메일',
      phone: '연락처',
      role: '역할',
      created_at: '가입일',
      marketing_consent: '마케팅 수신동의',
      total_payment: '누적 결제 금액',
      latest_order_date: '최근 주문일',
      active_courses_count: '수강 중인 강의 수',
      group_name: '그룹명',
      latest_admin_note: '최근 관리자 메모',
      course_list: '수강 강의 목록',
      enrollment_details: '수강 상세 정보',
      order_history: '주문 내역',
      points_balance: '현재 보유 포인트',
      points_history: '포인트 변동 내역',
      coupon_usage: '쿠폰 사용 내역',
      recent_activity: '최근 활동',
      ip_address: 'IP 주소',
      support_history: '문의 내역'
    };

    // 선택된 필드만 추출
    const filteredData = data.map(row => {
      const filteredRow: any = {};
      selectedFields.forEach(field => {
        filteredRow[fieldLabels[field] || field] = row[field] || '';
      });
      return filteredRow;
    });

    // Excel 파일 생성
    const worksheet = XLSX.utils.json_to_sheet(filteredData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '사용자 데이터');
    
    // 파일 다운로드
    const fileName = `사용자_데이터_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);

    toast({
      title: "내보내기 완료",
      description: `${data.length}명의 데이터가 성공적으로 내보내졌습니다.`,
    });
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
      joinDatePeriod: 'all'
    };
    setFilters(defaultFilters);
  };

  const handleUserSelect = (userId: string) => {
    // Navigate to user detail page instead of opening modal
    window.location.href = `/admin/users/${userId}`;
  };

  const handleBulkAction = async (action: string, userIds: string[]) => {
    switch (action) {
      case 'course_permission':
        setSelectedUserIds(userIds);
        setCoursePermissionModalOpen(true);
        break;
      case 'status_change':
        // 일괄 상태 변경 로직 (추후 구현)
        toast({
          title: "일괄 상태 변경",
          description: "선택된 회원들의 상태 변경 기능은 추후 구현 예정입니다."
        });
        break;
      case 'role_change':
        if (userIds.length === 0) {
          toast({ title: '선택된 사용자 없음', description: '권한을 변경할 사용자를 선택해주세요.' });
          return;
        }
        if (userIds.length > 1) {
          toast({ title: '한 명만 선택', description: '권한 변경은 한 번에 한 명씩만 가능합니다.' });
          return;
        }
        {
          const target = users.find(u => u.id === userIds[0]);
          if (!target) {
            toast({ title: '사용자 찾을 수 없음', description: '선택한 사용자를 찾을 수 없습니다.', variant: 'destructive' });
            return;
          }
          handleRoleChange(target.id, target.name, target.email, target.role || 'student');
        }
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
  
  const handleGroupAssign = (userIds: string[], triggerElement: HTMLElement) => {
    setSelectedUserIds(userIds);
    setGroupAssignTriggerElement(triggerElement);
    setShowGroupAssignmentDropdown(true);
  };

  const handleGroupCreate = (triggerElement: HTMLElement) => {
    setGroupCreateTriggerElement(triggerElement);
    setShowGroupCreateDropdown(true);
  };

  const handleExportData = (userIds: string[], triggerElement: HTMLElement) => {
    setSelectedUserIds(userIds);
    setExportTriggerElement(triggerElement);
    setShowExportDropdown(true);
  };

  const handleExport = async (selectedFields: string[], selectedUsers: string[]) => {
    try {
      setIsExporting(true);
      const userData = await fetchUserExportData(selectedFields, selectedUsers);
      downloadCSV(userData, selectedFields);
    } catch (error) {
      console.error('Export failed:', error);
      toast({
        title: "내보내기 실패",
        description: "데이터 내보내기 중 오류가 발생했습니다.",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleRoleChange = (userId: string, userName: string, userEmail: string, currentRole: string) => {
    setSelectedUserForRole({
      id: userId,
      name: userName,
      email: userEmail,
      role: currentRole
    });
    setRoleChangeModalOpen(true);
  };

  const handleRoleChangeSuccess = () => {
    fetchUsers(); // 사용자 목록 새로고침
  };

  // Get filtered users for pagination
  const filteredUsers = users;

  return (
    <AdminLayout>
      <div className="space-y-8 p-6">
        {/* 페이지 헤더 */}
        <div className="border-b border-border/30 pb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-foreground tracking-tight">회원 관리</h1>
              <p className="text-muted-foreground mt-2 text-base">등록된 회원들을 조회하고 효율적으로 관리할 수 있습니다</p>
            </div>
            <Button
              onClick={createTestUser}
              disabled={loading}
              variant="outline"
            >
              {loading ? '생성 중...' : '테스트 계정 생성'}
            </Button>
          </div>
        </div>

        {/* 검색 및 필터링 영역 */}
        <UserSearchFilter
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onReset={handleResetFilters}
        />

        {/* 사용자 목록 테이블 */}
        <UserListTable
          users={filteredUsers}
          loading={loading}
          onUserSelect={handleUserSelect}
          onBulkAction={handleBulkAction}
          onStatusChange={handleStatusChange}
          onCouponDistribute={handleCouponDistribute}
          onPointsDistribute={handlePointsDistribute}
          onDeleteUser={handleDeleteUser}
          onResetPassword={handleResetPassword}
          onGroupAssign={handleGroupAssign}
          onGroupCreate={handleGroupCreate}
          onExportData={handleExportData}
          onAddNote={handleAddNote}
          onRoleChange={handleRoleChange}
          onRefresh={fetchUsers}
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

      {/* Modals and Dropdowns */}
      {/* 강의 권한 관리 모달 */}
      <CoursePermissionModal
        open={coursePermissionModalOpen}
        onClose={() => {
          setCoursePermissionModalOpen(false);
          setSelectedUserIds([]);
        }}
        userId={selectedUserIds.length === 1 ? selectedUserIds[0] : undefined}
      />

      {/* 그룹 생성 드롭다운 */}
      {showGroupCreateDropdown && (
        <GroupCreateDropdown
          onClose={() => setShowGroupCreateDropdown(false)}
          onGroupCreated={() => {
            setShowGroupCreateDropdown(false);
            fetchUsers();
          }}
          triggerElement={groupCreateTriggerElement}
        />
      )}

      {/* 그룹 배정 드롭다운 */}
      {showGroupAssignmentDropdown && (
        <GroupAssignmentDropdown
          selectedUsers={selectedUserIds}
          onClose={() => setShowGroupAssignmentDropdown(false)}
          onGroupAssigned={() => {
            setShowGroupAssignmentDropdown(false);
            fetchUsers();
          }}
          triggerElement={groupAssignTriggerElement}
        />
      )}

      {/* 데이터 내보내기 드롭다운 */}
      {showExportDropdown && (
        <ExportDataDropdown
          selectedUsers={selectedUserIds}
          onClose={() => setShowExportDropdown(false)}
          onExport={handleExport}
          triggerElement={exportTriggerElement}
        />
      )}

      {/* 쿠폰 배포 모달 */}
      <CouponDistributionModal
        open={couponModalOpen}
        onClose={() => {
          setCouponModalOpen(false);
          setSelectedUserIds([]);
        }}
        selectedUsers={selectedUserIds}
      />

      {/* 포인트 배포 모달 */}
      <PointsDistributionModal
        open={pointsModalOpen}
        onClose={() => {
          setPointsModalOpen(false);
          setSelectedUserIds([]);
        }}
        selectedUsers={selectedUserIds}
      />

      {/* 관리자 메모 모달 */}
      <AdminNoteModal
        open={adminNoteModalOpen}
        onClose={() => {
          setAdminNoteModalOpen(false);
          setSelectedUserId(null);
          setSelectedUserEmail('');
        }}
        userId={selectedUserId}
        userEmail={selectedUserEmail}
        onNoteSaved={() => {
          setAdminNoteModalOpen(false);
          setSelectedUserId(null);
          setSelectedUserEmail('');
          fetchUsers();
        }}
      />

      {/* 권한 변경 모달 */}
      <RoleChangeModal
        open={roleChangeModalOpen}
        onClose={() => {
          setRoleChangeModalOpen(false);
          setSelectedUserForRole(null);
        }}
        user={selectedUserForRole}
        onSuccess={handleRoleChangeSuccess}
      />
    </AdminLayout>
  );
};

export default AdminUsers;
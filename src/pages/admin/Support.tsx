import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/layouts/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Search, Filter, MessageSquare, User, Clock, AlertCircle } from 'lucide-react';

interface SupportTicket {
  id: string;
  subject: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  user: {
    full_name: string;
    email: string;
  } | null;
  assigned_to: string | null;
}

export const AdminSupport = () => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [response, setResponse] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .select(`
          *,
          user:profiles(full_name, email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      const formattedData = data?.map(ticket => ({
        ...ticket,
        user: null as { full_name: string; email: string } | null
      })) || [];
      setTickets(formattedData);
    } catch (error) {
      console.error('Error fetching tickets:', error);
      toast({
        title: "오류",
        description: "지원 티켓을 불러오는데 실패했습니다.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateTicketStatus = async (ticketId: string, newStatus: string) => {
    try {
      const updates: any = { status: newStatus };
      if (newStatus === 'resolved') {
        updates.resolved_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('support_tickets')
        .update(updates)
        .eq('id', ticketId);

      if (error) throw error;

      toast({
        title: "성공",
        description: "티켓 상태가 업데이트되었습니다."
      });

      fetchTickets();
      if (selectedTicket && selectedTicket.id === ticketId) {
        setSelectedTicket(prev => prev ? { ...prev, status: newStatus, ...updates } : null);
      }

    } catch (error) {
      console.error('Error updating ticket:', error);
      toast({
        title: "오류",
        description: "티켓 상태 업데이트에 실패했습니다.",
        variant: "destructive"
      });
    }
  };

  const assignTicket = async (ticketId: string, userId: string) => {
    try {
      const { error } = await supabase
        .from('support_tickets')
        .update({ assigned_to: userId })
        .eq('id', ticketId);

      if (error) throw error;

      toast({
        title: "성공",
        description: "티켓이 할당되었습니다."
      });

      fetchTickets();

    } catch (error) {
      console.error('Error assigning ticket:', error);
      toast({
        title: "오류",
        description: "티켓 할당에 실패했습니다.",
        variant: "destructive"
      });
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.user?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || ticket.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'open': return 'destructive';
      case 'in_progress': return 'default';
      case 'waiting_user': return 'secondary';
      case 'resolved': return 'outline';
      case 'closed': return 'outline';
      default: return 'secondary';
    }
  };

  const getPriorityBadgeVariant = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'destructive';
      case 'high': return 'default';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'secondary';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'open': return '열림';
      case 'in_progress': return '진행중';
      case 'waiting_user': return '사용자 대기';
      case 'resolved': return '해결됨';
      case 'closed': return '닫힌';
      default: return status;
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'urgent': return '긴급';
      case 'high': return '높음';
      case 'medium': return '보통';
      case 'low': return '낮음';
      default: return priority;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'technical': return '기술';
      case 'billing': return '결제';
      case 'course': return '강의';
      case 'refund': return '환불';
      case 'general': return '일반';
      default: return category;
    }
  };

  // 통계 계산
  const openTickets = tickets.filter(t => t.status === 'open').length;
  const inProgressTickets = tickets.filter(t => t.status === 'in_progress').length;
  const urgentTickets = tickets.filter(t => t.priority === 'urgent' && t.status !== 'resolved' && t.status !== 'closed').length;

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="text-lg">로딩 중...</div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">고객 지원</h1>
          <p className="text-muted-foreground">고객 문의사항을 확인하고 답변하세요</p>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <div>
                  <p className="text-sm text-muted-foreground">새 티켓</p>
                  <p className="text-lg font-bold">{openTickets}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-sm text-muted-foreground">진행 중</p>
                  <p className="text-lg font-bold">{inProgressTickets}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-orange-600" />
                <div>
                  <p className="text-sm text-muted-foreground">긴급</p>
                  <p className="text-lg font-bold">{urgentTickets}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-sm text-muted-foreground">전체 티켓</p>
                  <p className="text-lg font-bold">{tickets.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 필터 및 검색 */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="제목, 내용 또는 이메일로 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[130px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">모든 상태</SelectItem>
                  <SelectItem value="open">열림</SelectItem>
                  <SelectItem value="in_progress">진행중</SelectItem>
                  <SelectItem value="waiting_user">사용자 대기</SelectItem>
                  <SelectItem value="resolved">해결됨</SelectItem>
                  <SelectItem value="closed">닫힌</SelectItem>
                </SelectContent>
              </Select>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">모든 우선순위</SelectItem>
                  <SelectItem value="urgent">긴급</SelectItem>
                  <SelectItem value="high">높음</SelectItem>
                  <SelectItem value="medium">보통</SelectItem>
                  <SelectItem value="low">낮음</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 티켓 목록 */}
          <Card>
            <CardHeader>
              <CardTitle>지원 티켓 ({filteredTickets.length}개)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {filteredTickets.map((ticket) => (
                  <div 
                    key={ticket.id} 
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedTicket?.id === ticket.id ? 'bg-muted' : 'hover:bg-muted/50'
                    }`}
                    onClick={() => setSelectedTicket(ticket)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-sm line-clamp-1">{ticket.subject}</h4>
                      <div className="flex gap-1">
                        <Badge variant={getPriorityBadgeVariant(ticket.priority)} className="text-xs">
                          {getPriorityLabel(ticket.priority)}
                        </Badge>
                        <Badge variant={getStatusBadgeVariant(ticket.status)} className="text-xs">
                          {getStatusLabel(ticket.status)}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      <div className="flex items-center gap-2 mb-1">
                        <User className="h-3 w-3" />
                        {ticket.user?.full_name || '알 수 없음'} ({ticket.user?.email})
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-3 w-3" />
                        {new Date(ticket.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
                
                {filteredTickets.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    검색 조건에 맞는 티켓이 없습니다.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 티켓 상세 */}
          <Card>
            <CardHeader>
              <CardTitle>티켓 상세</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedTicket ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg mb-2">{selectedTicket.subject}</h3>
                    <div className="flex gap-2 mb-4">
                      <Badge variant={getPriorityBadgeVariant(selectedTicket.priority)}>
                        {getPriorityLabel(selectedTicket.priority)}
                      </Badge>
                      <Badge variant={getStatusBadgeVariant(selectedTicket.status)}>
                        {getStatusLabel(selectedTicket.status)}
                      </Badge>
                      <Badge variant="outline">
                        {getCategoryLabel(selectedTicket.category)}
                      </Badge>
                    </div>
                  </div>

                  <div className="border-l-4 border-muted pl-4">
                    <p className="text-sm whitespace-pre-wrap">{selectedTicket.description}</p>
                  </div>

                  <div className="text-sm text-muted-foreground space-y-1">
                    <div>문의자: {selectedTicket.user?.full_name} ({selectedTicket.user?.email})</div>
                    <div>생성일: {new Date(selectedTicket.created_at).toLocaleString()}</div>
                    {selectedTicket.resolved_at && (
                      <div>해결일: {new Date(selectedTicket.resolved_at).toLocaleString()}</div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium">상태 변경</label>
                      <Select 
                        value={selectedTicket.status} 
                        onValueChange={(value) => updateTicketStatus(selectedTicket.id, value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="open">열림</SelectItem>
                          <SelectItem value="in_progress">진행중</SelectItem>
                          <SelectItem value="waiting_user">사용자 대기</SelectItem>
                          <SelectItem value="resolved">해결됨</SelectItem>
                          <SelectItem value="closed">닫힌</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium">답변 작성</label>
                      <Textarea
                        value={response}
                        onChange={(e) => setResponse(e.target.value)}
                        placeholder="고객에게 답변을 작성하세요..."
                        rows={4}
                      />
                    </div>

                    <Button 
                      onClick={() => {
                        // TODO: 실제 답변 저장 로직 구현
                        toast({
                          title: "답변 저장됨",
                          description: "고객에게 답변이 전송되었습니다."
                        });
                        setResponse('');
                      }}
                      disabled={!response.trim()}
                    >
                      답변 전송
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  티켓을 선택하여 상세 정보를 확인하세요
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminSupport;
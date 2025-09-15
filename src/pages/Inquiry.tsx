import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Clock, MessageCircle, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header';
import UserSidebar from '@/components/UserSidebar';

interface SupportTicket {
  id: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  category: string;
  created_at: string;
}

const Inquiry = () => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    subject: '',
    description: '',
    category: 'general',
    priority: 'medium'
  });
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    document.title = "1:1 문의 | 윈들리아카데미";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", "1:1 문의를 통해 궁금한 점을 해결하세요");
    
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchTickets();
  }, [user, navigate]);

  const fetchTickets = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTickets(data || []);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const { error } = await supabase
        .from('support_tickets')
        .insert({
          user_id: user.id,
          subject: formData.subject,
          description: formData.description,
          category: formData.category,
          priority: formData.priority
        });

      if (error) throw error;

      toast({
        title: "문의가 접수되었습니다",
        description: "빠른 시일 내에 답변드리겠습니다."
      });

      setFormData({
        subject: '',
        description: '',
        category: 'general',
        priority: 'medium'
      });
      setShowForm(false);
      fetchTickets();
    } catch (error) {
      console.error('Error creating ticket:', error);
      toast({
        title: "문의 접수에 실패했습니다",
        description: "다시 시도해주세요.",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <Badge>접수됨</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-600 text-white">처리중</Badge>;
      case 'resolved':
        return <Badge className="bg-green-600 text-white">해결됨</Badge>;
      case 'closed':
        return <Badge variant="secondary">종료됨</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge variant="destructive">높음</Badge>;
      case 'medium':
        return <Badge variant="outline">보통</Badge>;
      case 'low':
        return <Badge className="bg-gray-600 text-white">낮음</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  const getCategoryText = (category: string) => {
    switch (category) {
      case 'general':
        return '일반 문의';
      case 'technical':
        return '기술 문제';
      case 'billing':
        return '결제 문의';
      case 'course':
        return '강의 문의';
      default:
        return category;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">로딩 중...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-1">
              <UserSidebar />
            </div>
            
            <div className="lg:col-span-3">
              <div className="mb-8 flex justify-between items-center">
                <div>
                  <h1 className="text-3xl font-bold mb-2">1:1 문의</h1>
                  <p className="text-muted-foreground">궁금한 점이 있으시면 언제든 문의해주세요.</p>
                </div>
                <Button onClick={() => setShowForm(!showForm)}>
                  <Plus className="h-4 w-4 mr-2" />
                  새 문의 작성
                </Button>
              </div>

              {showForm && (
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle>새 문의 작성</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="category">문의 유형</Label>
                          <Select
                            value={formData.category}
                            onValueChange={(value) => setFormData({ ...formData, category: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="general">일반 문의</SelectItem>
                              <SelectItem value="technical">기술 문제</SelectItem>
                              <SelectItem value="billing">결제 문의</SelectItem>
                              <SelectItem value="course">강의 문의</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="priority">우선순위</Label>
                          <Select
                            value={formData.priority}
                            onValueChange={(value) => setFormData({ ...formData, priority: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="low">낮음</SelectItem>
                              <SelectItem value="medium">보통</SelectItem>
                              <SelectItem value="high">높음</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="subject">제목</Label>
                        <Input
                          id="subject"
                          value={formData.subject}
                          onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                          placeholder="문의 제목을 입력해주세요"
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="description">내용</Label>
                        <Textarea
                          id="description"
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          placeholder="문의 내용을 자세히 작성해주세요"
                          className="min-h-[120px]"
                          required
                        />
                      </div>
                      
                      <div className="flex gap-2 justify-end">
                        <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                          취소
                        </Button>
                        <Button type="submit">
                          문의 접수
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              )}

              {tickets.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <MessageCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">문의 내역이 없습니다</h3>
                    <p className="text-muted-foreground mb-4">궁금한 점이 있으시면 언제든 문의해주세요.</p>
                    <Button onClick={() => setShowForm(true)}>
                      문의 작성하기
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {tickets.map((ticket) => (
                    <Card key={ticket.id}>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg">{ticket.subject}</CardTitle>
                            <div className="flex items-center gap-2 mt-2">
                              {getStatusBadge(ticket.status)}
                              {getPriorityBadge(ticket.priority)}
                              <Badge variant="outline">
                                {getCategoryText(ticket.category)}
                              </Badge>
                            </div>
                          </div>
                          <div className="text-right text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {new Date(ticket.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground whitespace-pre-wrap">
                          {ticket.description}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Inquiry;
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, CreditCard, Package, Filter } from 'lucide-react';
import Header from '@/components/Header';
import UserSidebar from '@/components/UserSidebar';

interface OrderItem {
  id: string;
  price: number;
  course: {
    id: string;
    title: string;
    thumbnail_url: string;
  };
}

interface Order {
  id: string;
  total_amount: number;
  status: string;
  payment_method?: string;
  created_at: string;
  order_items: OrderItem[];
}

const PurchaseHistory = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [timeFilter, setTimeFilter] = useState<string>('all');
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }
    fetchOrders();
  }, [user, navigate]);

  useEffect(() => {
    applyFilters();
  }, [orders, statusFilter, timeFilter]);

  const fetchOrders = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          total_amount,
          status,
          payment_method,
          created_at,
          order_items (
            id,
            price,
            course:courses (
              id,
              title,
              thumbnail_url
            )
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'completed') // Only show completed orders
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Deduplicate orders by course - keep only the latest order for each course
      const deduplicatedOrders: Order[] = [];
      const seenCourses = new Set<string>();
      
      for (const order of data || []) {
        const orderCourseIds = order.order_items.map(item => item.course.id);
        const hasNewCourse = orderCourseIds.some(courseId => !seenCourses.has(courseId));
        
        if (hasNewCourse) {
          // Filter out course items that we've already seen
          const filteredOrderItems = order.order_items.filter(item => {
            if (!seenCourses.has(item.course.id)) {
              seenCourses.add(item.course.id);
              return true;
            }
            return false;
          });
          
          if (filteredOrderItems.length > 0) {
            deduplicatedOrders.push({
              ...order,
              order_items: filteredOrderItems
            });
          }
        }
      }
      
      setOrders(deduplicatedOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...orders];

    // 상태 필터
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    // 기간 필터
    if (timeFilter !== 'all') {
      const now = new Date();
      const filterDate = new Date();
      
      switch (timeFilter) {
        case '1month':
          filterDate.setMonth(now.getMonth() - 1);
          break;
        case '3months':
          filterDate.setMonth(now.getMonth() - 3);
          break;
        case '6months':
          filterDate.setMonth(now.getMonth() - 6);
          break;
        case '1year':
          filterDate.setFullYear(now.getFullYear() - 1);
          break;
      }
      
      if (timeFilter !== 'all') {
        filtered = filtered.filter(order => new Date(order.created_at) >= filterDate);
      }
    }

    setFilteredOrders(filtered);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-600 text-white">결제완료</Badge>;
      case 'pending':
        return <Badge variant="outline">결제대기</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">취소됨</Badge>;
      case 'refunded':
        return <Badge className="bg-orange-600 text-white">환불됨</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPaymentMethodText = (method?: string) => {
    switch (method) {
      case 'card':
        return '신용카드';
      case 'bank_transfer':
        return '계좌이체';
      case 'kakao_pay':
        return '카카오페이';
      case 'toss_pay':
        return '토스페이';
      default:
        return method || '-';
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
            {/* 사이드바 */}
            <div className="lg:col-span-1">
              <UserSidebar />
            </div>
            
            {/* 메인 콘텐츠 */}
            <div className="lg:col-span-3">
              {/* 헤더 */}
              <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">구매 내역</h1>
                <p className="text-muted-foreground">구매하신 강의들을 확인해보세요.</p>
              </div>

          {/* 필터 */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-4 items-center">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  <span className="text-sm font-medium">필터:</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-sm">상태</span>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">전체</SelectItem>
                      <SelectItem value="completed">결제완료</SelectItem>
                      <SelectItem value="pending">결제대기</SelectItem>
                      <SelectItem value="cancelled">취소됨</SelectItem>
                      <SelectItem value="refunded">환불됨</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm">기간</span>
                  <Select value={timeFilter} onValueChange={setTimeFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">전체</SelectItem>
                      <SelectItem value="1month">1개월</SelectItem>
                      <SelectItem value="3months">3개월</SelectItem>
                      <SelectItem value="6months">6개월</SelectItem>
                      <SelectItem value="1year">1년</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 주문 목록 */}
          {filteredOrders.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">구매 내역이 없습니다</h3>
                <p className="text-muted-foreground mb-4">아직 구매하신 강의가 없어요.</p>
                <Button onClick={() => navigate('/courses')}>
                  강의 둘러보기
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order) => (
                <Card key={order.id}>
                  <CardHeader className="pb-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          {getStatusBadge(order.status)}
                          <span className="text-sm text-muted-foreground">
                            주문번호: {order.id.slice(0, 8)}...
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {new Date(order.created_at).toLocaleDateString('ko-KR', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                          <div className="flex items-center gap-1">
                            <CreditCard className="h-4 w-4" />
                            {getPaymentMethodText(order.payment_method)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary">
                          {order.total_amount.toLocaleString()}원
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-4">
                      {order.order_items.map((item) => (
                        <div key={item.id} className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg">
                          <img
                            src={item.course.thumbnail_url || '/placeholder.svg'}
                            alt={item.course.title}
                            className="w-16 h-12 object-cover rounded flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium line-clamp-2">{item.course.title}</h4>
                            <p className="text-sm text-muted-foreground">
                              {item.price.toLocaleString()}원
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate(`/learn/${item.course.id}?from=purchase`)}
                          >
                            학습하기
                          </Button>
                        </div>
                      ))}
                    </div>
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

export default PurchaseHistory;
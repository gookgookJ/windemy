import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/layouts/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Search, Filter, CreditCard, User, Calendar, DollarSign } from 'lucide-react';

interface Order {
  id: string;
  total_amount: number;
  status: string;
  payment_method: string;
  created_at: string;
  user: {
    full_name: string;
    email: string;
  };
  order_items: {
    course: {
      title: string;
    };
    price: number;
  }[];
}

export const AdminOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const { toast } = useToast();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          total_amount,
          status,
          payment_method,
          created_at,
          user:profiles(full_name, email),
          order_items(
            price,
            course:courses(title)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({
        title: "오류",
        description: "주문 데이터를 불러오는데 실패했습니다.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.user?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'failed':
        return 'destructive';
      case 'cancelled':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return '완료';
      case 'pending':
        return '대기';
      case 'failed':
        return '실패';
      case 'cancelled':
        return '취소';
      default:
        return status;
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'card':
        return '카드';
      case 'bank_transfer':
        return '계좌이체';
      case 'mobile':
        return '모바일';
      default:
        return method || '미지정';
    }
  };

  // 통계 계산
  const totalRevenue = filteredOrders
    .filter(order => order.status === 'completed')
    .reduce((sum, order) => sum + order.total_amount, 0);
  
  const completedOrders = filteredOrders.filter(order => order.status === 'completed').length;
  const pendingOrders = filteredOrders.filter(order => order.status === 'pending').length;
  const failedOrders = filteredOrders.filter(order => order.status === 'failed').length;

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
          <h1 className="text-3xl font-bold text-foreground mb-2">주문 관리</h1>
          <p className="text-muted-foreground">결제 현황과 주문 내역을 관리하세요</p>
        </div>

        {/* 주문 통계 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-sm text-muted-foreground">총 매출</p>
                  <p className="text-lg font-bold">{totalRevenue.toLocaleString()}원</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-sm text-muted-foreground">완료된 주문</p>
                  <p className="text-lg font-bold">{completedOrders}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-orange-600" />
                <div>
                  <p className="text-sm text-muted-foreground">대기 중</p>
                  <p className="text-lg font-bold">{pendingOrders}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-red-600" />
                <div>
                  <p className="text-sm text-muted-foreground">실패한 주문</p>
                  <p className="text-lg font-bold">{failedOrders}</p>
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
                  placeholder="사용자명, 이메일 또는 주문 ID로 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="상태 필터" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">모든 상태</SelectItem>
                  <SelectItem value="completed">완료</SelectItem>
                  <SelectItem value="pending">대기</SelectItem>
                  <SelectItem value="failed">실패</SelectItem>
                  <SelectItem value="cancelled">취소</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* 주문 목록 */}
        <Card>
          <CardHeader>
            <CardTitle>주문 목록 ({filteredOrders.length}개)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredOrders.map((order) => (
                <div key={order.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">주문 #{order.id.substring(0, 8)}</h3>
                        <Badge variant={getStatusBadgeVariant(order.status)}>
                          {getStatusLabel(order.status)}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {order.user?.full_name} ({order.user?.email})
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(order.created_at).toLocaleString()}
                        </div>
                        <div className="flex items-center gap-1">
                          <CreditCard className="h-3 w-3" />
                          {getPaymentMethodLabel(order.payment_method)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-lg font-bold">
                        {order.total_amount.toLocaleString()}원
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {order.order_items?.length || 0}개 항목
                      </div>
                    </div>
                  </div>
                  
                  {/* 주문 상품 목록 */}
                  {order.order_items && order.order_items.length > 0 && (
                    <div className="border-t pt-3">
                      <div className="space-y-2">
                        {order.order_items.map((item, index) => (
                          <div key={index} className="flex justify-between items-center text-sm">
                            <span>{item.course?.title}</span>
                            <span>{item.price.toLocaleString()}원</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              
              {filteredOrders.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  검색 조건에 맞는 주문이 없습니다.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminOrders;
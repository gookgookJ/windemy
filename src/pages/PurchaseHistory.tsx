import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, CreditCard, Package, Filter, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header';
import UserSidebar from '@/components/UserSidebar';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { createSecureReceipt, type ReceiptData } from "@/utils/secureReceiptGenerator";

interface OrderItem {
  id: string;
  price: number;
  course_id: string;
  course?: {
    id: string;
    title: string;
    thumbnail_url: string;
  } | null;
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
  const { toast } = useToast();

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
            course_id
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch course info for all items
      const courseIds = Array.from(new Set(
        (data || []).flatMap((o: any) => (o.order_items || []).map((i: any) => i.course_id))
      ));

      const { data: coursesData } = await supabase
        .from('courses')
        .select('id, title, thumbnail_url')
        .in('id', courseIds.length > 0 ? courseIds : ['00000000-0000-0000-0000-000000000000']);

      const courseMap = new Map<string, { id: string; title: string; thumbnail_url: string }>(
        (coursesData || []).map((c: any) => [c.id, c])
      );
      
      // Deduplicate orders by course - keep only the latest order for each course
      const deduplicatedOrders: Order[] = [];
      const seenCourses = new Set<string>();
      
      for (const order of (data || [])) {
        const augmentedItems = (order.order_items || []).map((item: any) => ({
          id: item.id,
          price: item.price,
          course_id: item.course_id,
          course: courseMap.get(item.course_id) || null,
        }));

        const hasNewCourse = augmentedItems.some((item: any) => !seenCourses.has(item.course_id));
        
        if (hasNewCourse) {
          // Filter out course items that we've already seen
          const filteredOrderItems = augmentedItems.filter((item: any) => {
            if (!seenCourses.has(item.course_id)) {
              seenCourses.add(item.course_id);
              return true;
            }
            return false;
          });
          
          if (filteredOrderItems.length > 0) {
            deduplicatedOrders.push({
              ...order,
              order_items: filteredOrderItems,
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
      case 'free':
        return '무료';
      default:
        return method || '-';
    }
  };

  // 영수증 다운로드 함수 - 보안 강화 버전
  const downloadReceipt = async (order: Order) => {
    try {
      // 보안 강화: 영수증 데이터 구조화
      const receiptData: ReceiptData = {
        orderNumber: order.id,
        customerName: user?.user_metadata?.full_name || 'N/A',
        customerEmail: user?.email || 'N/A',
        orderDate: new Date(order.created_at).toLocaleString('ko-KR'),
        items: order.order_items.map(item => ({
          name: item.course?.title || '강의',
          price: item.price,
          quantity: 1
        })),
        totalAmount: order.total_amount,
        paymentMethod: getPaymentMethodText(order.payment_method)
      };

      // 보안 DOM 생성 (XSS 방지)
      const tempDiv = createSecureReceipt(receiptData);
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.top = '0';
      tempDiv.style.width = '600px';
      tempDiv.style.backgroundColor = 'white';
      document.body.appendChild(tempDiv);

      // html2canvas로 이미지 생성
      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      });

      // PDF 생성
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgData = canvas.toDataURL('image/png');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`영수증_${order.id.slice(0, 8)}.pdf`);

      // 임시 div 제거
      document.body.removeChild(tempDiv);

      toast({
        title: "영수증 다운로드 완료",
        description: "PDF 파일이 다운로드되었습니다."
      });
    } catch (error) {
      console.error('Receipt download error:', error);
      toast({
        title: "영수증 다운로드 실패",
        description: "영수증 생성 중 오류가 발생했습니다.",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">로딩 중...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* 사이드바 - Hide on mobile/tablet */}
            <div className="lg:col-span-1 hidden lg:block">
              <UserSidebar />
            </div>
            
            {/* 메인 콘텐츠 */}
            <div className="lg:col-span-3">
              {/* 헤더 */}
              <div className="mb-6 md:mb-8">
                <h1 className="text-xl md:text-2xl lg:text-3xl font-bold mb-2">구매 내역</h1>
                <p className="text-sm md:text-base text-muted-foreground">구매하신 강의들을 확인해보세요.</p>
              </div>

          {/* 필터 */}
          <Card className="mb-4 md:mb-6">
            <CardContent className="p-3 md:p-4">
              <div className="space-y-3 md:space-y-0 md:flex md:flex-wrap md:gap-4 md:items-center">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  <span className="text-sm font-medium">필터:</span>
                </div>
                
                <div className="grid grid-cols-2 gap-3 md:flex md:gap-4">
                  <div className="flex flex-col gap-1 md:flex-row md:items-center md:gap-2">
                    <span className="text-xs md:text-sm font-medium md:font-normal">상태</span>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-full md:w-32">
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

                  <div className="flex flex-col gap-1 md:flex-row md:items-center md:gap-2">
                    <span className="text-xs md:text-sm font-medium md:font-normal">기간</span>
                    <Select value={timeFilter} onValueChange={setTimeFilter}>
                      <SelectTrigger className="w-full md:w-32">
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
                  <CardHeader className="pb-3 md:pb-4">
                    <div className="flex flex-col gap-3 md:flex-row md:justify-between md:items-start">
                      <div className="space-y-2 flex-1">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
                          {getStatusBadge(order.status)}
                          <span className="text-xs sm:text-sm text-muted-foreground">
                            주문번호: {order.id.slice(0, 8)}...
                          </span>
                        </div>
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                            <span className="break-all">
                              {new Date(order.created_at).toLocaleDateString('ko-KR', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <CreditCard className="h-3 w-3 sm:h-4 sm:w-4" />
                            {getPaymentMethodText(order.payment_method)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl sm:text-2xl font-bold text-primary">
                          {order.total_amount.toLocaleString()}원
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-4">
                      {order.order_items.map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium line-clamp-2 text-sm sm:text-base">{item.course?.title || '강의'}</h4>
                            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                              {item.price.toLocaleString()}원
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => downloadReceipt(order)}
                            className="ml-3 flex-shrink-0"
                          >
                            <FileText className="h-4 w-4 mr-1" />
                            <span className="text-xs sm:text-sm">영수증</span>
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
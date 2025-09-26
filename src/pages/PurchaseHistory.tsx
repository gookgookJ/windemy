import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, CreditCard, Package, FileText, BookOpen } from 'lucide-react';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
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
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
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

  // Pagination calculations
  const totalPages = Math.ceil(orders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentOrders = orders.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

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
            <div className="lg:col-span-3 space-y-6">
              {/* 헤더 */}
              <div className="space-y-2">
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">구매 내역</h1>
                <p className="text-muted-foreground leading-relaxed">
                  구매하신 강의들을 확인하고 영수증을 다운로드하세요.
                </p>
              </div>

              {/* 주문 목록 */}
              {orders.length === 0 ? (
                <Card className="border border-border shadow-sm">
                  <CardContent className="p-8 md:p-16 text-center">
                    <Package className="h-16 md:h-20 w-16 md:w-20 text-muted-foreground mx-auto mb-4 md:mb-6" />
                    <h3 className="text-lg md:text-xl font-semibold mb-2 md:mb-3 text-foreground">구매 내역이 없습니다</h3>
                    <p className="text-muted-foreground mb-4 md:mb-6">아직 구매하신 강의가 없어요.</p>
                    <Button 
                      onClick={() => navigate('/courses')}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground"
                    >
                      강의 둘러보기
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-6">
                  {/* 페이지 정보 */}
                  <div className="flex justify-between items-center text-sm text-muted-foreground">
                    <span>총 {orders.length}개의 구매 내역</span>
                    <span>{currentPage} / {totalPages} 페이지</span>
                  </div>

                  {/* 주문 카드들 */}
                  <div className="space-y-4">
                    {currentOrders.map((order) => (
                      <Card key={order.id} className="border border-border shadow-sm hover:shadow-md transition-shadow">
                        <CardHeader className="p-4 md:p-6 pb-2 md:pb-4">
                          <div className="flex flex-col gap-3">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                              <div className="flex items-center gap-2">
                                {getStatusBadge(order.status)}
                                <span className="text-xs text-muted-foreground font-mono">
                                  #{order.id.slice(0, 8)}
                                </span>
                              </div>
                              <div className="text-lg md:text-xl font-bold text-primary">
                                {order.total_amount.toLocaleString()}원
                              </div>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                                <span>
                                  {new Date(order.created_at).toLocaleDateString('ko-KR', {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <CreditCard className="h-3 w-3 sm:h-4 sm:w-4" />
                                <span>{getPaymentMethodText(order.payment_method)}</span>
                              </div>
                            </div>
                          </div>
                        </CardHeader>
                        
                        <CardContent className="p-4 md:p-6 pt-0">
                          <div className="space-y-3">
                            {order.order_items.map((item) => (
                              <div 
                                key={item.id} 
                                className="p-3 md:p-4 bg-accent/30 rounded-lg border border-border/50"
                              >
                                <div className="flex flex-col gap-3">
                                  <div className="space-y-1">
                                    <h4 className="font-semibold text-sm md:text-base leading-tight text-foreground line-clamp-2">
                                      {item.course?.title || '강의'}
                                    </h4>
                                    <p className="text-xs md:text-sm font-medium text-primary">
                                      {item.price.toLocaleString()}원
                                    </p>
                                  </div>
                                  <div className="flex flex-col sm:flex-row gap-2">
                                    <Button
                                      size="sm"
                                      onClick={() => navigate(`/learn/${item.course_id}`)}
                                      className="bg-primary hover:bg-primary/90 text-primary-foreground h-8 text-xs font-medium flex-1 sm:flex-none"
                                    >
                                      <BookOpen className="h-3 w-3 mr-1" />
                                      수강하기
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => downloadReceipt(order)}
                                      className="h-8 text-xs font-medium border-border hover:bg-accent flex-1 sm:flex-none"
                                    >
                                      <FileText className="h-3 w-3 mr-1" />
                                      영수증
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* 페이지네이션 */}
                  {totalPages > 1 && (
                    <div className="flex justify-center mt-6">
                      <Pagination>
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious 
                              onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                              className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                            />
                          </PaginationItem>
                          
                          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let pageNumber;
                            if (totalPages <= 5) {
                              pageNumber = i + 1;
                            } else if (currentPage <= 3) {
                              pageNumber = i + 1;
                            } else if (currentPage >= totalPages - 2) {
                              pageNumber = totalPages - 4 + i;
                            } else {
                              pageNumber = currentPage - 2 + i;
                            }
                            
                            return (
                              <PaginationItem key={pageNumber}>
                                <PaginationLink
                                  onClick={() => handlePageChange(pageNumber)}
                                  isActive={currentPage === pageNumber}
                                  className="cursor-pointer"
                                >
                                  {pageNumber}
                                </PaginationLink>
                              </PaginationItem>
                            );
                          })}
                          
                          {totalPages > 5 && currentPage < totalPages - 2 && (
                            <>
                              <PaginationItem>
                                <PaginationEllipsis />
                              </PaginationItem>
                            </>
                          )}
                          
                          <PaginationItem>
                            <PaginationNext 
                              onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                              className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                            />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    </div>
                  )}
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
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Filter, Download, Eye, MoreHorizontal, Calendar, CreditCard, Package, FileText, FileSpreadsheet, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { AdminLayout } from "@/layouts/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from 'xlsx';

interface OrderItem {
  id: string;
  price: number;
  course: {
    id: string;
    title: string;
  };
}

interface Order {
  id: string;
  total_amount: number;
  status: string;
  payment_method?: string;
  created_at: string;
  user_id: string;
  profiles?: {
    full_name?: string;
    email: string;
  };
  order_items: OrderItem[];
}

const Orders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [timeFilter, setTimeFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("created_at");
  const [sortOrder, setSortOrder] = useState<string>("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [exporting, setExporting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [orders, searchTerm, statusFilter, timeFilter, sortBy, sortOrder]);

  useEffect(() => {
    setCurrentPage(1); // 필터 변경 시 첫 페이지로 이동
  }, [searchTerm, statusFilter, timeFilter]);

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
          user_id,
          profiles:user_id (
            full_name,
            email
          ),
          order_items (
            id,
            price,
            course:courses (
              id,
              title
            )
          )
        `)
        .order('created_at', { ascending: false })
        .limit(1000); // 대용량 데이터 대비 제한

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({
        title: "데이터 로딩 실패",
        description: "주문 데이터를 불러오는 중 오류가 발생했습니다.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...orders];

    // 검색어 필터
    if (searchTerm) {
      filtered = filtered.filter(order => 
        order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.profiles?.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.order_items.some(item => 
          item.course.title.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // 상태 필터
    if (statusFilter !== "all") {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    // 기간 필터
    if (timeFilter !== "all") {
      const now = new Date();
      const filterDate = new Date();
      
      switch (timeFilter) {
        case '1day':
          filterDate.setDate(now.getDate() - 1);
          break;
        case '1week':
          filterDate.setDate(now.getDate() - 7);
          break;
        case '1month':
          filterDate.setMonth(now.getMonth() - 1);
          break;
        case '3months':
          filterDate.setMonth(now.getMonth() - 3);
          break;
      }
      
      if (timeFilter !== "all") {
        filtered = filtered.filter(order => new Date(order.created_at) >= filterDate);
      }
    }

    
    // 정렬 적용
    filtered.sort((a, b) => {
      let aValue: any = a[sortBy as keyof Order];
      let bValue: any = b[sortBy as keyof Order];
      
      if (sortBy === 'user_name') {
        aValue = a.profiles?.full_name || '';
        bValue = b.profiles?.full_name || '';
      } else if (sortBy === 'course_title') {
        aValue = a.order_items[0]?.course.title || '';
        bValue = b.order_items[0]?.course.title || '';
      }
      
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

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

  const getTotalRevenue = () => {
    return filteredOrders
      .filter(order => order.status === 'completed')
      .reduce((sum, order) => sum + order.total_amount, 0);
  };

  const getOrderStats = () => {
    const total = filteredOrders.length;
    const completed = filteredOrders.filter(order => order.status === 'completed').length;
    const pending = filteredOrders.filter(order => order.status === 'pending').length;
    const cancelled = filteredOrders.filter(order => order.status === 'cancelled').length;
    
    return { total, completed, pending, cancelled };
  };

  // 페이지네이션 관련 함수
  const getPaginatedOrders = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredOrders.slice(startIndex, endIndex);
  };

  const getTotalPages = () => {
    return Math.ceil(filteredOrders.length / itemsPerPage);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  // CSV 내보내기 함수
  const exportToCSV = () => {
    setExporting(true);
    try {
      const csvData = filteredOrders.map(order => ({
        '주문번호': order.id,
        '고객명': order.profiles?.full_name || '이름 없음',
        '이메일': order.profiles?.email || '',
        '강의명': order.order_items.map(item => item.course.title).join(', '),
        '결제방법': getPaymentMethodText(order.payment_method),
        '상태': order.status === 'completed' ? '결제완료' : 
                order.status === 'pending' ? '결제대기' :
                order.status === 'cancelled' ? '취소됨' :
                order.status === 'refunded' ? '환불됨' : order.status,
        '주문금액': order.total_amount,
        '주문일시': new Date(order.created_at).toLocaleString('ko-KR')
      }));

      const csv = [
        Object.keys(csvData[0]).join(','),
        ...csvData.map(row => Object.values(row).map(value => 
          typeof value === 'string' && value.includes(',') ? `"${value}"` : value
        ).join(','))
      ].join('\n');

      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `주문목록_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "내보내기 완료",
        description: "CSV 파일이 다운로드되었습니다."
      });
    } catch (error) {
      console.error('CSV export error:', error);
      toast({
        title: "내보내기 실패",
        description: "CSV 파일 생성 중 오류가 발생했습니다.",
        variant: "destructive"
      });
    } finally {
      setExporting(false);
    }
  };

  // Excel 내보내기 함수
  const exportToExcel = () => {
    setExporting(true);
    try {
      const excelData = filteredOrders.map(order => ({
        '주문번호': order.id,
        '고객명': order.profiles?.full_name || '이름 없음',
        '이메일': order.profiles?.email || '',
        '강의명': order.order_items.map(item => item.course.title).join(', '),
        '결제방법': getPaymentMethodText(order.payment_method),
        '상태': order.status === 'completed' ? '결제완료' : 
                order.status === 'pending' ? '결제대기' :
                order.status === 'cancelled' ? '취소됨' :
                order.status === 'refunded' ? '환불됨' : order.status,
        '주문금액': order.total_amount,
        '주문일시': new Date(order.created_at).toLocaleString('ko-KR')
      }));

      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, '주문목록');

      // 컬럼 너비 조정
      const colWidths = [
        { wch: 30 }, // 주문번호
        { wch: 15 }, // 고객명
        { wch: 25 }, // 이메일
        { wch: 40 }, // 강의명
        { wch: 12 }, // 결제방법
        { wch: 12 }, // 상태
        { wch: 15 }, // 주문금액
        { wch: 20 }  // 주문일시
      ];
      worksheet['!cols'] = colWidths;

      XLSX.writeFile(workbook, `주문목록_${new Date().toISOString().split('T')[0]}.xlsx`);

      toast({
        title: "내보내기 완료",
        description: "Excel 파일이 다운로드되었습니다."
      });
    } catch (error) {
      console.error('Excel export error:', error);
      toast({
        title: "내보내기 실패",
        description: "Excel 파일 생성 중 오류가 발생했습니다.",
        variant: "destructive"
      });
    } finally {
      setExporting(false);
    }
  };

  const refreshData = () => {
    setLoading(true);
    fetchOrders();
  };

  const stats = getOrderStats();

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">주문 데이터를 불러오는 중...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* 헤더 */}
        <div>
          <h2 className="text-3xl font-bold tracking-tight">주문 관리</h2>
          <p className="text-muted-foreground">
            전체 주문을 관리하고 매출을 확인하세요.
          </p>
        </div>

        {/* 통계 카드 */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">총 주문</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">전체 주문 수</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">완료된 주문</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
              <p className="text-xs text-muted-foreground">결제 완료</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">대기 중</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.pending}</div>
              <p className="text-xs text-muted-foreground">결제 대기</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">총 매출</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{getTotalRevenue().toLocaleString()}원</div>
              <p className="text-xs text-muted-foreground">완료된 주문 기준</p>
            </CardContent>
          </Card>
        </div>

        {/* 필터 및 검색 */}
        <Card>
          <CardHeader>
            <CardTitle>주문 목록</CardTitle>
            <CardDescription>주문을 검색하고 필터링하세요.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4 mb-6">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="주문번호, 사용자명, 이메일, 강의명으로 검색..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="상태" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체 상태</SelectItem>
                  <SelectItem value="completed">결제완료</SelectItem>
                  <SelectItem value="pending">결제대기</SelectItem>
                  <SelectItem value="cancelled">취소됨</SelectItem>
                  <SelectItem value="refunded">환불됨</SelectItem>
                </SelectContent>
              </Select>

              <Select value={timeFilter} onValueChange={setTimeFilter}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="기간" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체 기간</SelectItem>
                  <SelectItem value="1day">1일</SelectItem>
                  <SelectItem value="1week">1주일</SelectItem>
                  <SelectItem value="1month">1개월</SelectItem>
                  <SelectItem value="3months">3개월</SelectItem>
                </SelectContent>
              </Select>

              <Button 
                variant="outline" 
                size="sm" 
                onClick={refreshData}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                새로고침
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" disabled={exporting || filteredOrders.length === 0}>
                    <Download className="h-4 w-4 mr-2" />
                    내보내기
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={exportToCSV} disabled={exporting}>
                    <FileText className="h-4 w-4 mr-2" />
                    CSV 파일로 내보내기
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={exportToExcel} disabled={exporting}>
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Excel 파일로 내보내기
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* 결과 요약 */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">
                총 {filteredOrders.length}개의 주문 중 {Math.min(itemsPerPage, filteredOrders.length - (currentPage - 1) * itemsPerPage)}개 표시
              </p>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">페이지당 표시:</span>
                <Select value={itemsPerPage.toString()} onValueChange={(value) => {
                  setItemsPerPage(Number(value));
                  setCurrentPage(1);
                }}>
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* 주문 테이블 */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort('id')}
                    >
                      주문번호
                      {sortBy === 'id' && (
                        <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort('user_name')}
                    >
                      고객
                      {sortBy === 'user_name' && (
                        <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort('course_title')}
                    >
                      강의
                      {sortBy === 'course_title' && (
                        <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort('payment_method')}
                    >
                      결제방법
                      {sortBy === 'payment_method' && (
                        <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort('status')}
                    >
                      상태
                      {sortBy === 'status' && (
                        <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort('total_amount')}
                    >
                      금액
                      {sortBy === 'total_amount' && (
                        <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort('created_at')}
                    >
                      주문일시
                      {sortBy === 'created_at' && (
                        <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getPaginatedOrders().length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        조건에 맞는 주문이 없습니다.
                      </TableCell>
                    </TableRow>
                  ) : (
                    getPaginatedOrders().map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-mono text-sm">
                          {order.id.slice(0, 8)}...
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {order.profiles?.full_name || '이름 없음'}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {order.profiles?.email}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-[200px]">
                            {order.order_items.map((item, index) => (
                              <div key={item.id} className="text-sm">
                                {item.course.title}
                                {index < order.order_items.length - 1 && ", "}
                              </div>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>{getPaymentMethodText(order.payment_method)}</TableCell>
                        <TableCell>{getStatusBadge(order.status)}</TableCell>
                        <TableCell className="font-medium">
                          {order.total_amount.toLocaleString()}원
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(order.created_at).toLocaleDateString('ko-KR', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Eye className="h-4 w-4 mr-2" />
                                상세보기
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Download className="h-4 w-4 mr-2" />
                                영수증 다운로드
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* 페이지네이션 */}
            {getTotalPages() > 1 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, filteredOrders.length)} / {filteredOrders.length}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    이전
                  </Button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, getTotalPages()) }, (_, i) => {
                      let pageNum;
                      if (getTotalPages() <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= getTotalPages() - 2) {
                        pageNum = getTotalPages() - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => handlePageChange(pageNum)}
                          className="w-8 h-8 p-0"
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === getTotalPages()}
                  >
                    다음
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default Orders;
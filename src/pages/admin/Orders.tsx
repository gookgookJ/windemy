import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Search, Filter, Download, Eye, MoreHorizontal, Calendar, CreditCard, Package, FileText, FileSpreadsheet, ChevronLeft, ChevronRight, RefreshCw, X } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { AdminLayout } from "@/layouts/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>("all");
  const [amountFilter, setAmountFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("created_at");
  const [sortOrder, setSortOrder] = useState<string>("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [exporting, setExporting] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState({
    id: true,
    customer: true,
    email: true,
    course: true,
    payment_method: true,
    status: true,
    amount: true,
    date: true
  });
  const { toast } = useToast();

  const exportColumns = [
    { key: 'id', label: '주문번호' },
    { key: 'customer', label: '고객명' },
    { key: 'email', label: '이메일' },
    { key: 'course', label: '강의명' },
    { key: 'payment_method', label: '결제방법' },
    { key: 'status', label: '상태' },
    { key: 'amount', label: '주문금액' },
    { key: 'date', label: '주문일시' }
  ];

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [orders, searchTerm, statusFilter, timeFilter, paymentMethodFilter, amountFilter, sortBy, sortOrder]);

  useEffect(() => {
    setCurrentPage(1); // 필터 변경 시 첫 페이지로 이동
    setSelectedOrders(new Set()); // 필터 변경 시 선택 초기화
    setSelectAll(false);
  }, [searchTerm, statusFilter, timeFilter, paymentMethodFilter, amountFilter]);

  useEffect(() => {
    // 현재 페이지의 모든 항목이 선택되었는지 확인
    const currentPageOrders = getPaginatedOrders();
    if (currentPageOrders.length > 0) {
      const allSelected = currentPageOrders.every(order => selectedOrders.has(order.id));
      setSelectAll(allSelected);
    }
  }, [selectedOrders, filteredOrders, currentPage, itemsPerPage]);

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

    // 결제방법 필터
    if (paymentMethodFilter !== "all") {
      filtered = filtered.filter(order => order.payment_method === paymentMethodFilter);
    }

    // 금액 필터
    if (amountFilter !== "all") {
      switch (amountFilter) {
        case 'free':
          filtered = filtered.filter(order => order.total_amount === 0);
          break;
        case 'under_50000':
          filtered = filtered.filter(order => order.total_amount > 0 && order.total_amount < 50000);
          break;
        case '50000_100000':
          filtered = filtered.filter(order => order.total_amount >= 50000 && order.total_amount < 100000);
          break;
        case 'over_100000':
          filtered = filtered.filter(order => order.total_amount >= 100000);
          break;
      }
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
        return '신용/체크카드';
      case 'bank_transfer':
        return '실시간 계좌이체';
      case 'free':
        return '무료';
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

  // CSV 내보내기 함수 (선택된 컬럼만)
  const exportToCSV = () => {
    setExporting(true);
    try {
      const csvData = filteredOrders.map(order => {
        const row: any = {};
        
        if (selectedColumns.id) row['주문번호'] = order.id;
        if (selectedColumns.customer) row['고객명'] = order.profiles?.full_name || '이름 없음';
        if (selectedColumns.email) row['이메일'] = order.profiles?.email || '';
        if (selectedColumns.course) row['강의명'] = order.order_items.map(item => item.course.title).join(', ');
        if (selectedColumns.payment_method) row['결제방법'] = getPaymentMethodText(order.payment_method);
        if (selectedColumns.status) {
          row['상태'] = order.status === 'completed' ? '결제완료' : 
                      order.status === 'pending' ? '결제대기' :
                      order.status === 'cancelled' ? '취소됨' :
                      order.status === 'refunded' ? '환불됨' : order.status;
        }
        if (selectedColumns.amount) row['주문금액'] = order.total_amount;
        if (selectedColumns.date) row['주문일시'] = new Date(order.created_at).toLocaleString('ko-KR');
        
        return row;
      });

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
      setShowExportModal(false);
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

  // Excel 내보내기 함수 (선택된 컬럼만)
  const exportToExcel = () => {
    setExporting(true);
    try {
      const excelData = filteredOrders.map(order => {
        const row: any = {};
        
        if (selectedColumns.id) row['주문번호'] = order.id;
        if (selectedColumns.customer) row['고객명'] = order.profiles?.full_name || '이름 없음';
        if (selectedColumns.email) row['이메일'] = order.profiles?.email || '';
        if (selectedColumns.course) row['강의명'] = order.order_items.map(item => item.course.title).join(', ');
        if (selectedColumns.payment_method) row['결제방법'] = getPaymentMethodText(order.payment_method);
        if (selectedColumns.status) {
          row['상태'] = order.status === 'completed' ? '결제완료' : 
                      order.status === 'pending' ? '결제대기' :
                      order.status === 'cancelled' ? '취소됨' :
                      order.status === 'refunded' ? '환불됨' : order.status;
        }
        if (selectedColumns.amount) row['주문금액'] = order.total_amount;
        if (selectedColumns.date) row['주문일시'] = new Date(order.created_at).toLocaleString('ko-KR');
        
        return row;
      });

      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, '주문목록');

      // 컬럼 너비 조정
      const colWidths: any[] = [];
      if (selectedColumns.id) colWidths.push({ wch: 30 });
      if (selectedColumns.customer) colWidths.push({ wch: 15 });
      if (selectedColumns.email) colWidths.push({ wch: 25 });
      if (selectedColumns.course) colWidths.push({ wch: 40 });
      if (selectedColumns.payment_method) colWidths.push({ wch: 12 });
      if (selectedColumns.status) colWidths.push({ wch: 12 });
      if (selectedColumns.amount) colWidths.push({ wch: 15 });
      if (selectedColumns.date) colWidths.push({ wch: 20 });
      
      worksheet['!cols'] = colWidths;

      XLSX.writeFile(workbook, `주문목록_${new Date().toISOString().split('T')[0]}.xlsx`);

      toast({
        title: "내보내기 완료",
        description: "Excel 파일이 다운로드되었습니다."
      });
      setShowExportModal(false);
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
    setSelectedOrders(new Set());
    setSelectAll(false);
    fetchOrders();
  };

  // 체크박스 관련 함수
  const handleSelectAll = (checked: boolean) => {
    const currentPageOrders = getPaginatedOrders();
    const newSelectedOrders = new Set(selectedOrders);
    
    if (checked) {
      currentPageOrders.forEach(order => newSelectedOrders.add(order.id));
    } else {
      currentPageOrders.forEach(order => newSelectedOrders.delete(order.id));
    }
    
    setSelectedOrders(newSelectedOrders);
    setSelectAll(checked);
  };

  const handleSelectOrder = (orderId: string, checked: boolean) => {
    const newSelectedOrders = new Set(selectedOrders);
    
    if (checked) {
      newSelectedOrders.add(orderId);
    } else {
      newSelectedOrders.delete(orderId);
    }
    
    setSelectedOrders(newSelectedOrders);
  };

  // 일괄 액션 함수
  const handleBulkAction = async (action: string) => {
    if (selectedOrders.size === 0) {
      toast({
        title: "선택된 항목 없음",
        description: "작업할 주문을 선택해주세요.",
        variant: "destructive"
      });
      return;
    }

    const selectedOrderIds = Array.from(selectedOrders);
    
    try {
      switch (action) {
        case 'export':
          // 선택된 주문만 내보내기
          const selectedOrdersData = filteredOrders.filter(order => selectedOrders.has(order.id));
          exportSelectedOrders(selectedOrdersData);
          break;
        case 'delete':
          // 주문 삭제 (실제로는 상태 변경)
          await bulkUpdateOrderStatus(selectedOrderIds, 'cancelled');
          toast({
            title: "일괄 처리 완료",
            description: `${selectedOrderIds.length}개 주문이 취소되었습니다.`
          });
          break;
        case 'complete':
          // 주문 완료 처리
          await bulkUpdateOrderStatus(selectedOrderIds, 'completed');
          toast({
            title: "일괄 처리 완료",
            description: `${selectedOrderIds.length}개 주문이 완료 처리되었습니다.`
          });
          break;
      }
      
      setSelectedOrders(new Set());
      setSelectAll(false);
      refreshData();
    } catch (error) {
      console.error('Bulk action error:', error);
      toast({
        title: "일괄 처리 실패",
        description: "작업 중 오류가 발생했습니다.",
        variant: "destructive"
      });
    }
  };

  const bulkUpdateOrderStatus = async (orderIds: string[], status: string) => {
    const { error } = await supabase
      .from('orders')
      .update({ status })
      .in('id', orderIds);
    
    if (error) throw error;

    // 주문이 취소되면 연관된 enrollments 삭제
    if (status === 'cancelled') {
      const { error: enrollmentError } = await supabase
        .from('enrollments')
        .delete()
        .in('course_id', 
          orders
            .filter(order => orderIds.includes(order.id))
            .flatMap(order => order.order_items.map(item => item.course.id))
        );
      
      if (enrollmentError) console.error('Enrollment deletion error:', enrollmentError);
    }
  };

  const exportSelectedOrders = (selectedOrdersData: Order[]) => {
    try {
      const csvData = selectedOrdersData.map(order => ({
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
      link.setAttribute('download', `선택된주문_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "내보내기 완료",
        description: `선택된 ${selectedOrdersData.length}개 주문이 내보내졌습니다.`
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "내보내기 실패",
        description: "선택된 주문 내보내기 중 오류가 발생했습니다.",
        variant: "destructive"
      });
    }
  };

  // 주문 상세보기 함수
  const handleOrderDetail = (order: Order) => {
    setSelectedOrder(order);
    setShowDetailModal(true);
  };

  // 개별 주문 취소 함수
  const handleOrderCancel = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'cancelled' })
        .eq('id', orderId);
      
      if (error) throw error;

      // 해당 주문의 강의 등록 삭제
      const order = orders.find(o => o.id === orderId);
      if (order) {
        const courseIds = order.order_items.map(item => item.course.id);
        const { error: enrollmentError } = await supabase
          .from('enrollments')
          .delete()
          .eq('user_id', order.user_id)
          .in('course_id', courseIds);
        
        if (enrollmentError) console.error('Enrollment deletion error:', enrollmentError);
      }

      // 로컬 상태 즉시 업데이트
      setOrders(prevOrders => 
        prevOrders.map(o => 
          o.id === orderId ? { ...o, status: 'cancelled' } : o
        )
      );

      toast({
        title: "주문 취소 완료",
        description: "주문이 취소되고 강의 등록이 해제되었습니다."
      });
      
    } catch (error) {
      console.error('Order cancel error:', error);
      toast({
        title: "주문 취소 실패",
        description: "주문 취소 중 오류가 발생했습니다.",
        variant: "destructive"
      });
    }
  };

  // 개별 주문 완료 처리 함수
  const handleOrderComplete = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'completed' })
        .eq('id', orderId);
      
      if (error) throw error;

      // 로컬 상태 즉시 업데이트
      setOrders(prevOrders => 
        prevOrders.map(o => 
          o.id === orderId ? { ...o, status: 'completed' } : o
        )
      );

      toast({
        title: "결제 완료 처리",
        description: "주문이 완료 처리되었습니다."
      });
      
    } catch (error) {
      console.error('Order complete error:', error);
      toast({
        title: "처리 실패",
        description: "주문 완료 처리 중 오류가 발생했습니다.",
        variant: "destructive"
      });
    }
  };

  // 영수증 다운로드 함수
  const downloadReceipt = async (order: Order) => {
    try {
      // 영수증 HTML 생성
      const receiptHTML = `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: 'Noto Sans KR', sans-serif; line-height: 1.6;">
          <div style="text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 20px;">
            <h1 style="color: #333; margin: 0;">결제 영수증</h1>
            <p style="color: #666; margin: 5px 0;">Receipt</p>
          </div>
          
          <div style="margin-bottom: 30px;">
            <h2 style="color: #333; margin-bottom: 15px;">주문 정보</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee; font-weight: bold; width: 30%;">주문번호:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${order.id}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee; font-weight: bold;">주문일시:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${new Date(order.created_at).toLocaleString('ko-KR')}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee; font-weight: bold;">고객명:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${order.profiles?.full_name || '이름 없음'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee; font-weight: bold;">이메일:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${order.profiles?.email || ''}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee; font-weight: bold;">결제방법:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${getPaymentMethodText(order.payment_method)}</td>
              </tr>
            </table>
          </div>

          <div style="margin-bottom: 30px;">
            <h2 style="color: #333; margin-bottom: 15px;">주문 상품</h2>
            <table style="width: 100%; border-collapse: collapse; border: 1px solid #ddd;">
              <thead>
                <tr style="background-color: #f8f9fa;">
                  <th style="padding: 12px; border-bottom: 1px solid #ddd; text-align: left;">강의명</th>
                  <th style="padding: 12px; border-bottom: 1px solid #ddd; text-align: right;">금액</th>
                </tr>
              </thead>
              <tbody>
                ${order.order_items.map(item => `
                  <tr>
                    <td style="padding: 12px; border-bottom: 1px solid #eee;">${item.course.title}</td>
                    <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">${item.price.toLocaleString()}원</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <div style="border-top: 2px solid #333; padding-top: 20px;">
            <div style="text-align: right;">
              <p style="font-size: 18px; font-weight: bold; color: #333; margin: 0;">
                총 결제금액: ${order.total_amount.toLocaleString()}원
              </p>
            </div>
          </div>

          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #666; font-size: 12px;">
            <p>본 영수증은 전자상거래 결제 완료를 증명하는 서류입니다.</p>
            <p>발행일: ${new Date().toLocaleString('ko-KR')}</p>
          </div>
        </div>
      `;

      // 임시 div 생성
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = receiptHTML;
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      document.body.appendChild(tempDiv);

      // HTML을 Canvas로 변환
      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        allowTaint: true
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
            고객 주문을 관리하고 매출을 확인하세요. 결제대기는 주문 생성 후 실제 결제가 완료되지 않은 상태입니다.
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
              <p className="text-xs text-muted-foreground">주문 후 미결제</p>
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
            <CardTitle className="flex items-center justify-between">
              <span>주문 목록</span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilterPanel(!showFilterPanel)}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  고급 필터
                </Button>
                <span className="text-sm text-muted-foreground">
                  전체 {filteredOrders.length}개
                </span>
              </div>
            </CardTitle>
            <CardDescription>주문을 검색하고 필터링하세요.</CardDescription>
          </CardHeader>
          <CardContent>
            {/* 기본 검색 및 빠른 필터 */}
            <div className="flex flex-wrap gap-4 mb-4">
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
            </div>

            {/* 고급 필터 패널 */}
            {showFilterPanel && (
              <div className="mb-6 p-4 bg-muted/30 rounded-lg border">
                <h3 className="font-medium mb-3">고급 필터</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-sm font-medium">결제방법</Label>
                    <Select value={paymentMethodFilter} onValueChange={setPaymentMethodFilter}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="전체" />
                      </SelectTrigger>
                       <SelectContent>
                         <SelectItem value="all">전체</SelectItem>
                         <SelectItem value="card">신용/체크카드</SelectItem>
                         <SelectItem value="bank_transfer">실시간 계좌이체</SelectItem>
                         <SelectItem value="free">무료</SelectItem>
                       </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium">주문금액</Label>
                    <Select value={amountFilter} onValueChange={setAmountFilter}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="전체" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">전체 금액</SelectItem>
                        <SelectItem value="free">무료 (0원)</SelectItem>
                        <SelectItem value="under_50000">5만원 미만</SelectItem>
                        <SelectItem value="50000_100000">5만원 - 10만원</SelectItem>
                        <SelectItem value="over_100000">10만원 이상</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-end">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setPaymentMethodFilter("all");
                        setAmountFilter("all");
                        setStatusFilter("all");
                        setTimeFilter("all");
                        setSearchTerm("");
                      }}
                      className="w-full"
                    >
                      필터 초기화
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* 선택된 항목 액션 바 */}
            {selectedOrders.size > 0 && (
              <div className="mb-4 p-3 bg-primary/10 border border-primary/20 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {selectedOrders.size}개 항목 선택됨
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleBulkAction('export')}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      선택 내보내기
                    </Button>
                     <Button
                       variant="outline"
                       size="sm"
                       onClick={() => handleBulkAction('complete')}
                       className="bg-green-50 hover:bg-green-100 text-green-700 border-green-300"
                     >
                       완료 처리
                     </Button>
                     <Button
                       variant="destructive"
                       size="sm"
                       onClick={() => handleBulkAction('delete')}
                       className="bg-red-50 hover:bg-red-100 text-red-700 border-red-300"
                     >
                       <X className="h-4 w-4 mr-1" />
                       주문취소
                     </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedOrders(new Set());
                        setSelectAll(false);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* 일반 액션 바 */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">
                총 {filteredOrders.length}개의 주문 중 {Math.min(itemsPerPage, filteredOrders.length - (currentPage - 1) * itemsPerPage)}개 표시
              </p>
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" disabled={exporting || filteredOrders.length === 0}>
                      <Download className="h-4 w-4 mr-2" />
                      내보내기
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setShowExportModal(true)} disabled={exporting}>
                      <FileText className="h-4 w-4 mr-2" />
                      데이터 내보내기
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                
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
            </div>

            {/* 주문 테이블 */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">
                      <Checkbox
                        checked={selectAll}
                        onCheckedChange={handleSelectAll}
                        aria-label="전체 선택"
                      />
                    </TableHead>
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
                      <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                        조건에 맞는 주문이 없습니다.
                      </TableCell>
                    </TableRow>
                  ) : (
                    getPaginatedOrders().map((order) => (
                      <TableRow key={order.id} className={selectedOrders.has(order.id) ? 'bg-muted/50' : ''}>
                        <TableCell>
                          <Checkbox
                            checked={selectedOrders.has(order.id)}
                            onCheckedChange={(checked) => handleSelectOrder(order.id, checked as boolean)}
                            aria-label={`주문 ${order.id.slice(0, 8)} 선택`}
                          />
                        </TableCell>
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
                           <div className="max-w-[250px]">
                             {order.order_items.map((item, index) => (
                               <div key={item.id} className="mb-1">
                                 <div className="text-sm font-medium text-foreground">
                                   {item.course.title}
                                 </div>
                                 <div className="text-xs text-muted-foreground">
                                   {item.price.toLocaleString()}원
                                 </div>
                                 {index < order.order_items.length - 1 && (
                                   <div className="border-b border-muted my-1"></div>
                                 )}
                               </div>
                             ))}
                             {order.order_items.length > 1 && (
                               <div className="text-xs text-primary font-medium mt-2">
                                 총 {order.order_items.length}개 강의
                               </div>
                             )}
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
                               <DropdownMenuItem onClick={() => handleOrderDetail(order)}>
                                 <Eye className="h-4 w-4 mr-2" />
                                 상세보기
                               </DropdownMenuItem>
                               <DropdownMenuItem onClick={() => downloadReceipt(order)}>
                                 <FileText className="h-4 w-4 mr-2" />
                                 영수증 다운로드
                               </DropdownMenuItem>
                               <DropdownMenuSeparator />
                               {order.status === 'pending' && (
                                 <DropdownMenuItem 
                                   onClick={() => handleOrderCancel(order.id)}
                                   className="flex items-center cursor-pointer text-red-600"
                                 >
                                   <X className="h-4 w-4 mr-2" />
                                   주문 취소
                                 </DropdownMenuItem>
                               )}
                               {order.status === 'pending' && (
                                 <DropdownMenuItem 
                                   onClick={() => handleOrderComplete(order.id)}
                                   className="flex items-center cursor-pointer text-green-600"
                                 >
                                   <CreditCard className="h-4 w-4 mr-2" />
                                   결제 완료 처리
                                 </DropdownMenuItem>
                               )}
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

        {/* 데이터 내보내기 모달 */}
        <Dialog open={showExportModal} onOpenChange={setShowExportModal}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>데이터 내보내기</DialogTitle>
              <DialogDescription>
                내보낼 컬럼을 선택하고 파일 형식을 선택하세요.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label className="text-base font-medium">내보낼 컬럼 선택</Label>
                <div className="grid grid-cols-2 gap-3 mt-3">
                  {exportColumns.map((column) => (
                    <div key={column.key} className="flex items-center space-x-2">
                      <Checkbox
                        id={column.key}
                        checked={selectedColumns[column.key as keyof typeof selectedColumns]}
                        onCheckedChange={(checked) => {
                          setSelectedColumns(prev => ({
                            ...prev,
                            [column.key]: checked
                          }));
                        }}
                      />
                      <Label htmlFor={column.key} className="text-sm font-normal">
                        {column.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <div>
                <Label className="text-base font-medium">파일 형식</Label>
                <div className="flex gap-3 mt-3">
                  <Button
                    onClick={exportToCSV}
                    disabled={exporting || Object.values(selectedColumns).every(v => !v)}
                    className="flex-1"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    CSV 파일
                  </Button>
                  <Button
                    onClick={exportToExcel}
                    disabled={exporting || Object.values(selectedColumns).every(v => !v)}
                    className="flex-1"
                  >
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Excel 파일
                  </Button>
                </div>
              </div>

              {Object.values(selectedColumns).every(v => !v) && (
                <p className="text-sm text-red-500">최소 하나의 컬럼을 선택해주세요.</p>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* 주문 상세보기 모달 */}
        <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
          <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
            {selectedOrder && (
              <>
                <DialogHeader>
                  <DialogTitle>주문 상세정보</DialogTitle>
                  <DialogDescription>
                    주문번호: {selectedOrder.id}
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-6">
                  {/* 주문 기본 정보 */}
                  <div>
                    <h3 className="font-semibold text-lg mb-3">주문 정보</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm text-muted-foreground">주문일시</Label>
                        <p className="text-sm font-medium">
                          {new Date(selectedOrder.created_at).toLocaleString('ko-KR')}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm text-muted-foreground">주문상태</Label>
                        <div className="mt-1">
                          {getStatusBadge(selectedOrder.status)}
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm text-muted-foreground">결제방법</Label>
                        <p className="text-sm font-medium">
                          {getPaymentMethodText(selectedOrder.payment_method)}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm text-muted-foreground">총 결제금액</Label>
                        <p className="text-lg font-bold text-primary">
                          {selectedOrder.total_amount.toLocaleString()}원
                        </p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* 고객 정보 */}
                  <div>
                    <h3 className="font-semibold text-lg mb-3">고객 정보</h3>
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <Label className="text-sm text-muted-foreground">고객명</Label>
                        <p className="text-sm font-medium">
                          {selectedOrder.profiles?.full_name || '이름 없음'}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm text-muted-foreground">이메일</Label>
                        <p className="text-sm font-medium">
                          {selectedOrder.profiles?.email || '이메일 없음'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* 주문 상품 */}
                  <div>
                    <h3 className="font-semibold text-lg mb-3">주문 상품</h3>
                    <div className="space-y-3">
                      {selectedOrder.order_items.map((item, index) => (
                        <div key={item.id} className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                          <div>
                            <p className="font-medium">{item.course.title}</p>
                            <p className="text-sm text-muted-foreground">강의 ID: {item.course.id}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">{item.price.toLocaleString()}원</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* 액션 버튼 */}
                  <div className="flex gap-3">
                    <Button 
                      onClick={() => downloadReceipt(selectedOrder)}
                      className="flex-1"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      영수증 다운로드
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setShowDetailModal(false)}
                      className="flex-1"
                    >
                      닫기
                    </Button>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default Orders;
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/layouts/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Search, Filter, Plus, Edit, Trash2, Copy, Calendar } from 'lucide-react';

interface Coupon {
  id: string;
  code: string;
  name: string;
  description: string;
  discount_type: string;
  discount_value: number;
  min_order_amount: number;
  max_discount_amount: number | null;
  usage_limit: number | null;
  used_count: number;
  is_active: boolean;
  valid_from: string;
  valid_until: string;
  applicable_courses: string[];
  created_at: string;
}

export const AdminCoupons = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const { toast } = useToast();

  const [newCoupon, setNewCoupon] = useState({
    code: '',
    name: '',
    description: '',
    discount_type: 'percentage',
    discount_value: 0,
    min_order_amount: 0,
    max_discount_amount: null as number | null,
    usage_limit: null as number | null,
    is_active: true,
    valid_from: new Date().toISOString().split('T')[0],
    valid_until: ''
  });

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCoupons(data || []);
    } catch (error) {
      console.error('Error fetching coupons:', error);
      toast({
        title: "오류",
        description: "쿠폰을 불러오는데 실패했습니다.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const generateCouponCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewCoupon(prev => ({ ...prev, code: result }));
  };

  const createCoupon = async () => {
    try {
      if (!newCoupon.code || !newCoupon.name || !newCoupon.valid_until) {
        toast({
          title: "오류",
          description: "필수 필드를 모두 입력해주세요.",
          variant: "destructive"
        });
        return;
      }

      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('인증되지 않은 사용자');

      const { error } = await supabase
        .from('coupons')
        .insert({
          ...newCoupon,
          created_by: user.user.id,
          valid_from: new Date(newCoupon.valid_from).toISOString(),
          valid_until: new Date(newCoupon.valid_until).toISOString(),
          applicable_courses: []
        });

      if (error) throw error;

      toast({
        title: "성공",
        description: "쿠폰이 생성되었습니다."
      });

      setNewCoupon({
        code: '',
        name: '',
        description: '',
        discount_type: 'percentage',
        discount_value: 0,
        min_order_amount: 0,
        max_discount_amount: null,
        usage_limit: null,
        is_active: true,
        valid_from: new Date().toISOString().split('T')[0],
        valid_until: ''
      });
      setShowCreateForm(false);
      fetchCoupons();

    } catch (error) {
      console.error('Error creating coupon:', error);
      toast({
        title: "오류",
        description: "쿠폰 생성에 실패했습니다.",
        variant: "destructive"
      });
    }
  };

  const updateCoupon = async () => {
    if (!editingCoupon) return;

    try {
      const { error } = await supabase
        .from('coupons')
        .update({
          name: editingCoupon.name,
          description: editingCoupon.description,
          discount_type: editingCoupon.discount_type,
          discount_value: editingCoupon.discount_value,
          min_order_amount: editingCoupon.min_order_amount,
          max_discount_amount: editingCoupon.max_discount_amount,
          usage_limit: editingCoupon.usage_limit,
          is_active: editingCoupon.is_active,
          valid_from: editingCoupon.valid_from,
          valid_until: editingCoupon.valid_until
        })
        .eq('id', editingCoupon.id);

      if (error) throw error;

      toast({
        title: "성공",
        description: "쿠폰이 수정되었습니다."
      });

      setEditingCoupon(null);
      fetchCoupons();

    } catch (error) {
      console.error('Error updating coupon:', error);
      toast({
        title: "오류",
        description: "쿠폰 수정에 실패했습니다.",
        variant: "destructive"
      });
    }
  };

  const deleteCoupon = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    try {
      const { error } = await supabase
        .from('coupons')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "성공",
        description: "쿠폰이 삭제되었습니다."
      });

      fetchCoupons();

    } catch (error) {
      console.error('Error deleting coupon:', error);
      toast({
        title: "오류",
        description: "쿠폰 삭제에 실패했습니다.",
        variant: "destructive"
      });
    }
  };

  const copyCouponCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: "복사됨",
      description: "쿠폰 코드가 클립보드에 복사되었습니다."
    });
  };

  const filteredCoupons = coupons.filter(coupon => {
    const matchesSearch = coupon.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         coupon.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && coupon.is_active && new Date(coupon.valid_until) > new Date()) ||
                         (statusFilter === 'inactive' && !coupon.is_active) ||
                         (statusFilter === 'expired' && new Date(coupon.valid_until) <= new Date());
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (coupon: Coupon) => {
    if (!coupon.is_active) {
      return <Badge variant="secondary">비활성</Badge>;
    }
    if (new Date(coupon.valid_until) <= new Date()) {
      return <Badge variant="destructive">만료</Badge>;
    }
    if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) {
      return <Badge variant="outline">사용완료</Badge>;
    }
    return <Badge variant="default">활성</Badge>;
  };

  const getDiscountText = (coupon: Coupon) => {
    if (coupon.discount_type === 'percentage') {
      return `${coupon.discount_value}%`;
    } else {
      return `${coupon.discount_value.toLocaleString()}원`;
    }
  };

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
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">쿠폰 관리</h1>
            <p className="text-muted-foreground">할인 쿠폰을 생성하고 관리하세요</p>
          </div>
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            새 쿠폰
          </Button>
        </div>

        {/* 새 쿠폰 생성 폼 */}
        {showCreateForm && (
          <Card>
            <CardHeader>
              <CardTitle>새 쿠폰 생성</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>쿠폰 코드</Label>
                  <div className="flex gap-2">
                    <Input
                      value={newCoupon.code}
                      onChange={(e) => setNewCoupon(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                      placeholder="COUPON2024"
                    />
                    <Button variant="outline" onClick={generateCouponCode}>생성</Button>
                  </div>
                </div>
                <div>
                  <Label>쿠폰 이름</Label>
                  <Input
                    value={newCoupon.name}
                    onChange={(e) => setNewCoupon(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="신규 회원 할인"
                  />
                </div>
              </div>

              <div>
                <Label>설명</Label>
                <Textarea
                  value={newCoupon.description}
                  onChange={(e) => setNewCoupon(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="쿠폰 설명을 입력하세요"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>할인 유형</Label>
                  <Select 
                    value={newCoupon.discount_type} 
                    onValueChange={(value) => setNewCoupon(prev => ({ ...prev, discount_type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">퍼센트</SelectItem>
                      <SelectItem value="fixed_amount">고정 금액</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>할인 값</Label>
                  <Input
                    type="number"
                    value={newCoupon.discount_value}
                    onChange={(e) => setNewCoupon(prev => ({ ...prev, discount_value: Number(e.target.value) }))}
                    placeholder={newCoupon.discount_type === 'percentage' ? '10' : '5000'}
                  />
                </div>
                <div>
                  <Label>최소 주문 금액</Label>
                  <Input
                    type="number"
                    value={newCoupon.min_order_amount}
                    onChange={(e) => setNewCoupon(prev => ({ ...prev, min_order_amount: Number(e.target.value) }))}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>최대 할인 금액</Label>
                  <Input
                    type="number"
                    value={newCoupon.max_discount_amount || ''}
                    onChange={(e) => setNewCoupon(prev => ({ ...prev, max_discount_amount: e.target.value ? Number(e.target.value) : null }))}
                    placeholder="제한 없음"
                  />
                </div>
                <div>
                  <Label>사용 제한</Label>
                  <Input
                    type="number"
                    value={newCoupon.usage_limit || ''}
                    onChange={(e) => setNewCoupon(prev => ({ ...prev, usage_limit: e.target.value ? Number(e.target.value) : null }))}
                    placeholder="제한 없음"
                  />
                </div>
                <div className="flex items-center space-x-2 pt-6">
                  <Switch
                    checked={newCoupon.is_active}
                    onCheckedChange={(checked) => setNewCoupon(prev => ({ ...prev, is_active: checked }))}
                  />
                  <Label>활성화</Label>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>시작일</Label>
                  <Input
                    type="date"
                    value={newCoupon.valid_from}
                    onChange={(e) => setNewCoupon(prev => ({ ...prev, valid_from: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>종료일</Label>
                  <Input
                    type="date"
                    value={newCoupon.valid_until}
                    onChange={(e) => setNewCoupon(prev => ({ ...prev, valid_until: e.target.value }))}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={createCoupon}>생성</Button>
                <Button variant="outline" onClick={() => setShowCreateForm(false)}>취소</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 편집 폼 */}
        {editingCoupon && (
          <Card>
            <CardHeader>
              <CardTitle>쿠폰 편집</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>쿠폰 코드</Label>
                  <Input value={editingCoupon.code} disabled />
                </div>
                <div>
                  <Label>쿠폰 이름</Label>
                  <Input
                    value={editingCoupon.name}
                    onChange={(e) => setEditingCoupon(prev => prev ? ({ ...prev, name: e.target.value }) : null)}
                  />
                </div>
              </div>

              <div>
                <Label>설명</Label>
                <Textarea
                  value={editingCoupon.description}
                  onChange={(e) => setEditingCoupon(prev => prev ? ({ ...prev, description: e.target.value }) : null)}
                  rows={2}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={editingCoupon.is_active}
                  onCheckedChange={(checked) => setEditingCoupon(prev => prev ? ({ ...prev, is_active: checked }) : null)}
                />
                <Label>활성화</Label>
              </div>

              <div className="flex gap-2">
                <Button onClick={updateCoupon}>저장</Button>
                <Button variant="outline" onClick={() => setEditingCoupon(null)}>취소</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 필터 및 검색 */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="쿠폰 코드 또는 이름으로 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">모든 상태</SelectItem>
                  <SelectItem value="active">활성</SelectItem>
                  <SelectItem value="inactive">비활성</SelectItem>
                  <SelectItem value="expired">만료</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* 쿠폰 목록 */}
        <Card>
          <CardHeader>
            <CardTitle>쿠폰 목록 ({filteredCoupons.length}개)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredCoupons.map((coupon) => (
                <div key={coupon.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <code className="bg-muted px-2 py-1 rounded text-sm font-mono">
                            {coupon.code}
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyCouponCode(coupon.code)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                        <h3 className="font-semibold">{coupon.name}</h3>
                        {getStatusBadge(coupon)}
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-2">
                        {coupon.description}
                      </p>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>할인: {getDiscountText(coupon)}</span>
                        {coupon.min_order_amount > 0 && (
                          <span>최소 주문: {coupon.min_order_amount.toLocaleString()}원</span>
                        )}
                        {coupon.usage_limit && (
                          <span>사용: {coupon.used_count}/{coupon.usage_limit}</span>
                        )}
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(coupon.valid_from).toLocaleDateString()} ~ {new Date(coupon.valid_until).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingCoupon(coupon)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteCoupon(coupon.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              
              {filteredCoupons.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  검색 조건에 맞는 쿠폰이 없습니다.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminCoupons;
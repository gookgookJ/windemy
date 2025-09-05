import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Trash2, ShoppingCart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

interface CartItem {
  id: string;
  course: {
    id: string;
    title: string;
    price: number;
    thumbnail_url: string;
    instructor: {
      full_name: string;
    };
  };
}

const Cart = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchCartItems();
  }, [user, navigate]);

  const fetchCartItems = async () => {
    try {
      const { data, error } = await supabase
        .from('cart_items')
        .select(`
          id,
          course:courses(
            id,
            title,
            price,
            thumbnail_url,
            instructor:profiles(full_name)
          )
        `)
        .eq('user_id', user?.id);

      if (error) throw error;
      setCartItems(data || []);
    } catch (error) {
      console.error('Error fetching cart:', error);
      toast({
        title: "오류",
        description: "장바구니를 불러오는데 실패했습니다.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const removeFromCart = async (cartItemId: string) => {
    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', cartItemId);

      if (error) throw error;
      
      setCartItems(items => items.filter(item => item.id !== cartItemId));
      toast({
        title: "삭제 완료",
        description: "강의가 장바구니에서 제거되었습니다."
      });
    } catch (error) {
      console.error('Error removing from cart:', error);
      toast({
        title: "오류",
        description: "강의 삭제에 실패했습니다.",
        variant: "destructive"
      });
    }
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => total + item.course.price, 0);
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) return;
    
    toast({
      title: "결제 기능",
      description: "결제 기능은 현재 개발 중입니다."
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">로딩 중...</div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">장바구니</h1>
            <p className="text-muted-foreground">선택한 강의들을 확인하고 결제하세요</p>
          </div>

          {cartItems.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <ShoppingCart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">장바구니가 비어있습니다</h3>
                <p className="text-muted-foreground mb-6">관심있는 강의를 장바구니에 추가해보세요</p>
                <Link to="/courses">
                  <Button>강의 둘러보기</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-4">
                {cartItems.map((item) => (
                  <Card key={item.id}>
                    <CardContent className="p-6">
                      <div className="flex gap-4">
                        <img
                          src={item.course.thumbnail_url || "/placeholder.svg"}
                          alt={item.course.title}
                          className="w-24 h-16 object-cover rounded"
                        />
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-1">{item.course.title}</h3>
                          <p className="text-muted-foreground text-sm">
                            강사: {item.course.instructor?.full_name}
                          </p>
                          <div className="flex items-center justify-between mt-3">
                            <span className="text-lg font-bold text-primary">
                              {item.course.price.toLocaleString()}원
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => removeFromCart(item.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="lg:col-span-1">
                <Card className="sticky top-4">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold mb-4">주문 요약</h3>
                    <div className="space-y-3 mb-6">
                      <div className="flex justify-between">
                        <span>강의 수량</span>
                        <span>{cartItems.length}개</span>
                      </div>
                      <div className="flex justify-between">
                        <span>소계</span>
                        <span>{calculateTotal().toLocaleString()}원</span>
                      </div>
                      <div className="border-t pt-3">
                        <div className="flex justify-between font-semibold text-lg">
                          <span>총 금액</span>
                          <span className="text-primary">{calculateTotal().toLocaleString()}원</span>
                        </div>
                      </div>
                    </div>
                    <Button 
                      className="w-full" 
                      size="lg"
                      onClick={handleCheckout}
                      disabled={cartItems.length === 0}
                    >
                      결제하기
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Cart;
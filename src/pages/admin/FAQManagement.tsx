import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/layouts/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Save, X, MoveUp, MoveDown, Eye } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface FAQ {
  id: string;
  category: string;
  question: string;
  answer: string;
  order_index: number;
  is_active: boolean;
  created_at: string;
}

const FAQManagement = () => {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [previewFaq, setPreviewFaq] = useState<FAQ | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [formData, setFormData] = useState({
    category: "",
    question: "",
    answer: "",
    order_index: 0,
    is_active: true,
  });

  const { data: faqs, isLoading } = useQuery({
    queryKey: ["admin-faqs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("faqs")
        .select("*")
        .order("category")
        .order("order_index");
      
      if (error) throw error;
      return data as FAQ[];
    },
  });

  const categories = Array.from(new Set(faqs?.map(f => f.category) || []));
  const filteredFaqs = activeCategory === "all" 
    ? faqs 
    : faqs?.filter(f => f.category === activeCategory);

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from("faqs").insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-faqs"] });
      toast.success("FAQ가 생성되었습니다");
      resetForm();
    },
    onError: () => toast.error("FAQ 생성 실패"),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const { error } = await supabase.from("faqs").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-faqs"] });
      toast.success("FAQ가 수정되었습니다");
      setEditingId(null);
      resetForm();
    },
    onError: () => toast.error("FAQ 수정 실패"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("faqs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-faqs"] });
      toast.success("FAQ가 삭제되었습니다");
      setDeletingId(null);
    },
    onError: () => toast.error("FAQ 삭제 실패"),
  });

  const reorderMutation = useMutation({
    mutationFn: async ({ id, newOrder }: { id: string; newOrder: number }) => {
      const { error } = await supabase
        .from("faqs")
        .update({ order_index: newOrder })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-faqs"] });
      toast.success("순서가 변경되었습니다");
    },
    onError: () => toast.error("순서 변경 실패"),
  });

  const resetForm = () => {
    setFormData({ category: "", question: "", answer: "", order_index: 0, is_active: true });
    setEditingId(null);
  };

  const handleEdit = (faq: FAQ) => {
    setEditingId(faq.id);
    setFormData({
      category: faq.category,
      question: faq.question,
      answer: faq.answer,
      order_index: faq.order_index,
      is_active: faq.is_active,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.category.trim() || !formData.question.trim() || !formData.answer.trim()) {
      toast.error("모든 필드를 입력해주세요");
      return;
    }

    if (editingId) {
      updateMutation.mutate({ id: editingId, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleReorder = (faq: FAQ, direction: "up" | "down") => {
    const sameCategoryFaqs = faqs?.filter(f => f.category === faq.category).sort((a, b) => a.order_index - b.order_index) || [];
    const currentIndex = sameCategoryFaqs.findIndex(f => f.id === faq.id);
    
    if (direction === "up" && currentIndex > 0) {
      const prevFaq = sameCategoryFaqs[currentIndex - 1];
      reorderMutation.mutate({ id: faq.id, newOrder: prevFaq.order_index });
      reorderMutation.mutate({ id: prevFaq.id, newOrder: faq.order_index });
    } else if (direction === "down" && currentIndex < sameCategoryFaqs.length - 1) {
      const nextFaq = sameCategoryFaqs[currentIndex + 1];
      reorderMutation.mutate({ id: faq.id, newOrder: nextFaq.order_index });
      reorderMutation.mutate({ id: nextFaq.id, newOrder: faq.order_index });
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">FAQ 관리</h1>
          <p className="text-muted-foreground">자주 묻는 질문을 카테고리별로 관리합니다</p>
        </div>

        <Tabs defaultValue="manage">
          <TabsList>
            <TabsTrigger value="manage">FAQ 관리</TabsTrigger>
            <TabsTrigger value="create">새 FAQ 추가</TabsTrigger>
          </TabsList>

          <TabsContent value="create" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{editingId ? "FAQ 수정" : "새 FAQ 추가"}</CardTitle>
                <CardDescription>
                  사용자가 자주 묻는 질문과 답변을 작성하세요
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="category">카테고리</Label>
                      <Input
                        id="category"
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        placeholder="예: 강의 수강, 결제 및 환불"
                      />
                    </div>

                    <div>
                      <Label htmlFor="order">순서</Label>
                      <Input
                        id="order"
                        type="number"
                        value={formData.order_index}
                        onChange={(e) =>
                          setFormData({ ...formData, order_index: parseInt(e.target.value) || 0 })
                        }
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="question">질문</Label>
                    <Input
                      id="question"
                      value={formData.question}
                      onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                      placeholder="예: 강의는 언제까지 수강할 수 있나요?"
                    />
                  </div>

                  <div>
                    <Label htmlFor="answer">답변</Label>
                    <Textarea
                      id="answer"
                      value={formData.answer}
                      onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                      placeholder="자세한 답변을 입력하세요"
                      rows={6}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, is_active: checked })
                      }
                    />
                    <Label htmlFor="is_active">활성화</Label>
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                      <Save className="w-4 h-4 mr-2" />
                      {editingId ? "수정" : "추가"}
                    </Button>
                    {editingId && (
                      <Button type="button" variant="outline" onClick={resetForm}>
                        <X className="w-4 h-4 mr-2" />
                        취소
                      </Button>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="manage" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>FAQ 목록</CardTitle>
                  <Select value={activeCategory} onValueChange={setActiveCategory}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="카테고리 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">전체</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <p>로딩 중...</p>
                ) : !filteredFaqs || filteredFaqs.length === 0 ? (
                  <p className="text-muted-foreground">등록된 FAQ가 없습니다</p>
                ) : (
                  <div className="space-y-4">
                    {filteredFaqs.map((faq) => (
                      <Card key={faq.id} className={!faq.is_active ? "opacity-50" : ""}>
                        <CardHeader>
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="text-sm text-muted-foreground mb-1">
                                {faq.category} • 순서: {faq.order_index}
                              </div>
                              <CardTitle className="text-lg">{faq.question}</CardTitle>
                              <CardDescription className="mt-2">
                                {faq.answer.substring(0, 100)}
                                {faq.answer.length > 100 && "..."}
                              </CardDescription>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => setPreviewFaq(faq)}
                                title="미리보기"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleReorder(faq, "up")}
                                title="위로"
                              >
                                <MoveUp className="w-4 h-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleReorder(faq, "down")}
                                title="아래로"
                              >
                                <MoveDown className="w-4 h-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleEdit(faq)}
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => setDeletingId(faq.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* 미리보기 Dialog */}
      <Dialog open={!!previewFaq} onOpenChange={() => setPreviewFaq(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{previewFaq?.question}</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <p className="text-sm text-muted-foreground mb-2">
              카테고리: {previewFaq?.category}
            </p>
            <p className="whitespace-pre-wrap leading-relaxed">{previewFaq?.answer}</p>
          </div>
        </DialogContent>
      </Dialog>

      {/* 삭제 확인 Dialog */}
      <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>FAQ 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              이 FAQ를 삭제하시겠습니까? 이 작업은 취소할 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingId && deleteMutation.mutate(deletingId)}
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default FAQManagement;
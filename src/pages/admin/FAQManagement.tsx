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
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Save, ArrowLeft, GripVertical } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

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
  const [isCreating, setIsCreating] = useState(false);
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

  const groupedFaqs = faqs?.reduce((acc, faq) => {
    if (!acc[faq.category]) acc[faq.category] = [];
    acc[faq.category].push(faq);
    return acc;
  }, {} as Record<string, FAQ[]>);

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

  const resetForm = () => {
    setFormData({ category: "", question: "", answer: "", order_index: 0, is_active: true });
    setEditingId(null);
    setIsCreating(false);
  };

  const handleEdit = (faq: FAQ) => {
    setEditingId(faq.id);
    setIsCreating(true);
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

  if (isCreating) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={resetForm}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">{editingId ? "FAQ 수정" : "새 FAQ 추가"}</h1>
              <p className="text-muted-foreground">자주 묻는 질문과 답변을 작성하세요</p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid lg:grid-cols-2 gap-6">
              {/* 편집 영역 */}
              <Card>
                <CardHeader>
                  <CardTitle>FAQ 작성</CardTitle>
                  <CardDescription>질문과 답변을 입력하세요</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="category">카테고리</Label>
                      <Input
                        id="category"
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        placeholder="예: 강의 수강"
                      />
                    </div>

                    <div>
                      <Label htmlFor="order">순서 (낮을수록 먼저 표시)</Label>
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
                      className="text-base"
                    />
                  </div>

                  <div>
                    <Label htmlFor="answer">답변</Label>
                    <Textarea
                      id="answer"
                      value={formData.answer}
                      onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                      placeholder="자세한 답변을 입력하세요.&#10;&#10;Enter 키로 줄바꿈하면 단락이 구분됩니다."
                      rows={15}
                    />
                    <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                      <p className="text-sm font-semibold mb-2">💡 작성 가이드</p>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• 간결하고 명확하게 작성하세요</li>
                        <li>• Enter 두번으로 단락을 구분하세요</li>
                        <li>• 필요시 예시를 포함하세요</li>
                      </ul>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 pt-2">
                    <Switch
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, is_active: checked })
                      }
                    />
                    <Label htmlFor="is_active">
                      {formData.is_active ? "활성화됨 (사용자에게 표시)" : "비활성화됨 (숨김)"}
                    </Label>
                  </div>
                </CardContent>
              </Card>

              {/* 미리보기 영역 */}
              <Card>
                <CardHeader>
                  <CardTitle>실시간 미리보기</CardTitle>
                  <CardDescription>사용자에게 보여질 모습입니다</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="border rounded-lg p-5 min-h-[500px] bg-muted/20">
                    {formData.question || formData.answer ? (
                      <Accordion type="single" collapsible defaultValue="preview">
                        <AccordionItem value="preview">
                          <AccordionTrigger className="hover:no-underline">
                            <div className="text-left">
                              <div className="text-xs text-muted-foreground mb-1">{formData.category || "카테고리"}</div>
                              <span className="font-medium">{formData.question || "질문을 입력하세요"}</span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="text-muted-foreground text-base leading-relaxed whitespace-pre-wrap pt-4">
                            {formData.answer || "답변을 입력하세요"}
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    ) : (
                      <p className="text-muted-foreground text-center py-12">
                        왼쪽에서 내용을 입력하면 여기에 미리보기가 표시됩니다
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex gap-3 mt-6">
              <Button type="submit" size="lg" disabled={createMutation.isPending || updateMutation.isPending}>
                <Save className="w-4 h-4 mr-2" />
                {editingId ? "수정 완료" : "FAQ 추가"}
              </Button>
              <Button type="button" variant="outline" size="lg" onClick={resetForm}>
                취소
              </Button>
            </div>
          </form>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">FAQ 관리</h1>
            <p className="text-muted-foreground">자주 묻는 질문을 카테고리별로 관리합니다</p>
          </div>
          <Button onClick={() => setIsCreating(true)} size="lg">
            <Plus className="w-4 h-4 mr-2" />
            새 FAQ 추가
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>등록된 FAQ</CardTitle>
            <CardDescription>총 {faqs?.length || 0}개의 FAQ (카테고리별로 그룹화됨)</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-center py-8 text-muted-foreground">로딩 중...</p>
            ) : !faqs || faqs.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">등록된 FAQ가 없습니다</p>
                <Button onClick={() => setIsCreating(true)} variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  첫 FAQ 작성하기
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(groupedFaqs || {}).map(([category, items]) => (
                  <div key={category}>
                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      <span>{category}</span>
                      <span className="text-sm text-muted-foreground">({items.length}개)</span>
                    </h3>
                    <div className="space-y-2">
                      {items.map((faq) => (
                        <Card key={faq.id} className={!faq.is_active ? "opacity-60 bg-muted/30" : ""}>
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <GripVertical className="w-5 h-5 text-muted-foreground mt-1 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded">
                                        순서 {faq.order_index}
                                      </span>
                                      {!faq.is_active && (
                                        <span className="text-xs px-2 py-0.5 bg-muted rounded">비활성</span>
                                      )}
                                    </div>
                                    <h4 className="font-medium mb-1">{faq.question}</h4>
                                    <p className="text-sm text-muted-foreground line-clamp-2">
                                      {faq.answer}
                                    </p>
                                  </div>
                                  <div className="flex gap-1 flex-shrink-0">
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      onClick={() => handleEdit(faq)}
                                      title="수정"
                                    >
                                      <Pencil className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      onClick={() => setDeletingId(faq.id)}
                                      title="삭제"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

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

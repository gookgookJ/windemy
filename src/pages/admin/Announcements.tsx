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
import { Save, Pencil, Trash2, Eye, Calendar, Plus, ArrowLeft } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface Announcement {
  id: string;
  title: string;
  content: string;
  is_active: boolean;
  priority: number;
  created_at: string;
}

const Announcements = () => {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    is_active: true,
    priority: 0,
  });

  const { data: announcements, isLoading } = useQuery({
    queryKey: ["admin-announcements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("announcements")
        .select("*")
        .order("priority", { ascending: false })
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as Announcement[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from("announcements").insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-announcements"] });
      toast.success("공지사항이 생성되었습니다");
      resetForm();
    },
    onError: () => toast.error("공지사항 생성 실패"),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const { error } = await supabase.from("announcements").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-announcements"] });
      toast.success("공지사항이 수정되었습니다");
      resetForm();
    },
    onError: () => toast.error("공지사항 수정 실패"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("announcements").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-announcements"] });
      toast.success("공지사항이 삭제되었습니다");
      setDeletingId(null);
    },
    onError: () => toast.error("공지사항 삭제 실패"),
  });

  const resetForm = () => {
    setFormData({ title: "", content: "", is_active: true, priority: 0 });
    setEditingId(null);
    setIsCreating(false);
  };

  const handleEdit = (announcement: Announcement) => {
    setEditingId(announcement.id);
    setIsCreating(true);
    setFormData({
      title: announcement.title,
      content: announcement.content,
      is_active: announcement.is_active,
      priority: announcement.priority,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error("제목과 내용을 입력해주세요");
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
              <h1 className="text-3xl font-bold">{editingId ? "공지사항 수정" : "새 공지사항 작성"}</h1>
              <p className="text-muted-foreground">사용자에게 전달할 중요한 내용을 작성하세요</p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid lg:grid-cols-2 gap-6">
              {/* 편집 영역 */}
              <Card>
                <CardHeader>
                  <CardTitle>내용 작성</CardTitle>
                  <CardDescription>공지사항의 제목과 내용을 입력하세요</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="title">제목</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="공지사항 제목을 입력하세요"
                      className="text-lg font-semibold"
                    />
                  </div>

                  <div>
                    <Label htmlFor="content">내용</Label>
                    <Textarea
                      id="content"
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      placeholder="공지사항 내용을 입력하세요.&#10;&#10;Enter 키로 줄바꿈을 하면 단락이 구분됩니다.&#10;&#10;- 대시(-)를 사용하면 목록이 됩니다&#10;- 이렇게 말이죠"
                      rows={20}
                      className="font-mono"
                    />
                    <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                      <p className="text-sm font-semibold mb-2">💡 작성 가이드</p>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• <strong>Enter 한번</strong>: 줄바꿈</li>
                        <li>• <strong>Enter 두번</strong>: 단락 구분</li>
                        <li>• <strong>- 기호</strong>: 목록 만들기</li>
                      </ul>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="flex items-center space-x-2">
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

                    <div>
                      <Label htmlFor="priority">우선순위 (높을수록 상단)</Label>
                      <Input
                        id="priority"
                        type="number"
                        value={formData.priority}
                        onChange={(e) =>
                          setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })
                        }
                      />
                    </div>
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
                    {formData.title || formData.content ? (
                      <>
                        <h3 className="font-semibold text-xl mb-3">{formData.title || "제목을 입력하세요"}</h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                          <Calendar className="h-4 w-4" />
                          <time>{new Date().toLocaleDateString('ko-KR')}</time>
                        </div>
                        <div className="text-base leading-relaxed whitespace-pre-wrap text-muted-foreground">
                          {formData.content || "내용을 입력하세요"}
                        </div>
                      </>
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
                {editingId ? "수정 완료" : "공지사항 등록"}
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
            <h1 className="text-3xl font-bold">공지사항 관리</h1>
            <p className="text-muted-foreground">사용자에게 표시될 공지사항을 관리합니다</p>
          </div>
          <Button onClick={() => setIsCreating(true)} size="lg">
            <Plus className="w-4 h-4 mr-2" />
            새 공지사항 작성
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>등록된 공지사항</CardTitle>
            <CardDescription>총 {announcements?.length || 0}개의 공지사항</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-center py-8 text-muted-foreground">로딩 중...</p>
            ) : !announcements || announcements.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">등록된 공지사항이 없습니다</p>
                <Button onClick={() => setIsCreating(true)} variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  첫 공지사항 작성하기
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {announcements.map((announcement) => (
                  <Card key={announcement.id} className={!announcement.is_active ? "opacity-60 bg-muted/30" : "border-l-4 border-l-primary"}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-lg">{announcement.title}</h3>
                            {!announcement.is_active && (
                              <span className="text-xs px-2 py-1 bg-muted rounded">비활성</span>
                            )}
                            <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded">
                              우선순위 {announcement.priority}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2 whitespace-pre-wrap">
                            {announcement.content}
                          </p>
                          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            <span>{new Date(announcement.created_at).toLocaleDateString('ko-KR')}</span>
                          </div>
                        </div>
                        <div className="flex gap-1 flex-shrink-0">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleEdit(announcement)}
                            title="수정"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setDeletingId(announcement.id)}
                            title="삭제"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
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
            <AlertDialogTitle>공지사항 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              이 공지사항을 삭제하시겠습니까? 이 작업은 취소할 수 없습니다.
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

export default Announcements;

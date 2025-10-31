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
import { Save, X, Pencil, Trash2, Eye, Calendar } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  const [previewAnnouncement, setPreviewAnnouncement] = useState<Announcement | null>(null);
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
      setEditingId(null);
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
  };

  const handleEdit = (announcement: Announcement) => {
    setEditingId(announcement.id);
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

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">공지사항 관리</h1>
          <p className="text-muted-foreground">사용자에게 표시될 공지사항을 관리합니다</p>
        </div>

        <Tabs defaultValue="manage">
          <TabsList>
            <TabsTrigger value="manage">공지사항 목록</TabsTrigger>
            <TabsTrigger value="create">{editingId ? "공지사항 수정" : "새 공지사항"}</TabsTrigger>
          </TabsList>

          <TabsContent value="create" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{editingId ? "공지사항 수정" : "새 공지사항 작성"}</CardTitle>
                <CardDescription>
                  사용자에게 전달할 중요한 내용을 작성하세요
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="title">제목</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="공지사항 제목"
                      className="text-lg"
                    />
                  </div>

                  <div>
                    <Label htmlFor="content">내용</Label>
                    <Textarea
                      id="content"
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      placeholder="공지사항 내용을 입력하세요. 줄바꿈은 Enter로 구분됩니다."
                      rows={12}
                      className="font-mono"
                    />
                    <p className="text-sm text-muted-foreground mt-2">
                      💡 팁: 줄바꿈(Enter)과 빈 줄이 그대로 적용됩니다. 
                      - 기호를 사용하면 목록으로 표시됩니다.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="is_active"
                        checked={formData.is_active}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, is_active: checked })
                        }
                      />
                      <Label htmlFor="is_active">
                        활성화 {formData.is_active ? "(사용자에게 표시됨)" : "(숨김)"}
                      </Label>
                    </div>

                    <div>
                      <Label htmlFor="priority">우선순위 (높을수록 먼저 표시)</Label>
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

                  <div className="flex gap-2 pt-4">
                    <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                      <Save className="w-4 h-4 mr-2" />
                      {editingId ? "수정 완료" : "공지사항 등록"}
                    </Button>
                    {editingId && (
                      <Button type="button" variant="outline" onClick={resetForm}>
                        <X className="w-4 h-4 mr-2" />
                        취소
                      </Button>
                    )}
                    {formData.title && formData.content && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setPreviewAnnouncement({ ...formData, id: "preview", created_at: new Date().toISOString() } as Announcement)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        미리보기
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
                <CardTitle>공지사항 목록</CardTitle>
                <CardDescription>등록된 모든 공지사항을 관리합니다</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <p>로딩 중...</p>
                ) : !announcements || announcements.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    등록된 공지사항이 없습니다. 첫 공지사항을 작성해보세요!
                  </p>
                ) : (
                  <div className="space-y-3">
                    {announcements.map((announcement) => (
                      <Card key={announcement.id} className={!announcement.is_active ? "opacity-60 bg-muted/30" : "border-l-4 border-l-primary"}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-semibold text-lg truncate">{announcement.title}</h3>
                                {!announcement.is_active && (
                                  <span className="text-xs px-2 py-1 bg-muted rounded">숨김</span>
                                )}
                                <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded">
                                  우선순위: {announcement.priority}
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
                                onClick={() => setPreviewAnnouncement(announcement)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleEdit(announcement)}
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => setDeletingId(announcement.id)}
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
          </TabsContent>
        </Tabs>
      </div>

      {/* 미리보기 Dialog */}
      <Dialog open={!!previewAnnouncement} onOpenChange={() => setPreviewAnnouncement(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">{previewAnnouncement?.title}</DialogTitle>
            <DialogDescription>
              {previewAnnouncement?.created_at && new Date(previewAnnouncement.created_at).toLocaleDateString('ko-KR')}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <p className="whitespace-pre-wrap leading-relaxed">{previewAnnouncement?.content}</p>
          </div>
        </DialogContent>
      </Dialog>

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
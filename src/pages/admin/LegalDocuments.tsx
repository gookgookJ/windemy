import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/layouts/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Save, FileText, Shield, Clock, ArrowLeft } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface LegalDocument {
  id: string;
  document_type: "terms" | "privacy";
  title: string;
  content: string;
  version: string;
  effective_date: string;
  is_active: boolean;
  created_at: string;
}

const LegalDocuments = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"terms" | "privacy">("terms");
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    version: "",
  });

  const { data: documents, isLoading } = useQuery({
    queryKey: ["legal-documents"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("legal_documents")
        .select("*")
        .order("effective_date", { ascending: false });
      
      if (error) throw error;
      return data as LegalDocument[];
    },
  });

  const activeTerms = documents?.find(
    (doc) => doc.document_type === "terms" && doc.is_active
  );
  const activePrivacy = documents?.find(
    (doc) => doc.document_type === "privacy" && doc.is_active
  );

  const termsHistory = documents?.filter(doc => doc.document_type === "terms") || [];
  const privacyHistory = documents?.filter(doc => doc.document_type === "privacy") || [];

  const currentDoc = activeTab === "terms" ? activeTerms : activePrivacy;
  const history = activeTab === "terms" ? termsHistory : privacyHistory;

  // 현재 활성 문서를 폼에 로드
  useEffect(() => {
    if (currentDoc && !isEditing) {
      setFormData({
        title: currentDoc.title,
        content: currentDoc.content,
        version: currentDoc.version,
      });
    }
  }, [activeTab, currentDoc, isEditing]);

  const updateMutation = useMutation({
    mutationFn: async ({
      type,
      data,
    }: {
      type: "terms" | "privacy";
      data: typeof formData;
    }) => {
      // 기존 활성 문서 비활성화
      await supabase
        .from("legal_documents")
        .update({ is_active: false })
        .eq("document_type", type)
        .eq("is_active", true);

      // 새 문서 추가
      const { error } = await supabase.from("legal_documents").insert({
        document_type: type,
        title: data.title,
        content: data.content,
        version: data.version,
        is_active: true,
        effective_date: new Date().toISOString(),
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["legal-documents"] });
      toast.success("문서가 업데이트되었습니다");
      setIsEditing(false);
    },
    onError: () => toast.error("문서 업데이트 실패"),
  });

  const loadVersion = (doc: LegalDocument) => {
    setFormData({
      title: doc.title,
      content: doc.content,
      version: doc.version,
    });
    setIsEditing(true);
    toast.success("선택한 버전이 로드되었습니다");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim() || !formData.version.trim()) {
      toast.error("모든 필드를 입력해주세요");
      return;
    }

    // 버전 확인
    const nextVersion = incrementVersion(formData.version);
    if (window.confirm(`새 버전 ${nextVersion}으로 저장하시겠습니까?\n\n이전 버전은 자동으로 비활성화되고 히스토리에 보관됩니다.`)) {
      updateMutation.mutate({ 
        type: activeTab, 
        data: { ...formData, version: nextVersion }
      });
    }
  };

  const incrementVersion = (version: string): string => {
    const parts = version.split('.');
    if (parts.length >= 2) {
      const lastPart = parseInt(parts[parts.length - 1]);
      parts[parts.length - 1] = (lastPart + 1).toString();
      return parts.join('.');
    }
    return `${version}.1`;
  };

  if (isEditing) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setIsEditing(false)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">
                {activeTab === "terms" ? "이용약관" : "개인정보처리방침"} 수정
              </h1>
              <p className="text-muted-foreground">
                새 버전을 작성하면 기존 버전은 자동으로 비활성화됩니다
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid lg:grid-cols-2 gap-6">
              {/* 편집 영역 */}
              <Card>
                <CardHeader>
                  <CardTitle>문서 작성</CardTitle>
                  <CardDescription>약관 내용을 입력하세요</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="title">문서 제목</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="예: 윈들리 아카데미 이용약관"
                      />
                    </div>

                    <div>
                      <Label htmlFor="version">현재 버전</Label>
                      <Input
                        id="version"
                        value={formData.version}
                        onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                        placeholder="1.0"
                        disabled
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        저장 시 자동으로 {incrementVersion(formData.version)}로 증가합니다
                      </p>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="content">문서 내용</Label>
                    <Textarea
                      id="content"
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      placeholder="문서 내용을 입력하세요"
                      rows={25}
                      className="font-mono text-sm"
                    />
                    <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                      <p className="text-sm font-semibold mb-2">💡 작성 가이드</p>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Enter 두번으로 단락을 구분하세요</li>
                        <li>• 제목은 <strong>**굵게**</strong> 표시할 수 있습니다</li>
                        <li>• <strong>-</strong> 기호로 목록을 만들 수 있습니다</li>
                        <li>• 표는 <strong>|</strong> 기호로 구분하세요</li>
                      </ul>
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
                  <div className="border rounded-lg p-6 min-h-[600px] bg-muted/20 overflow-y-auto max-h-[600px]">
                    {formData.title || formData.content ? (
                      <>
                        <h1 className="text-2xl font-bold mb-4">{formData.title || "제목을 입력하세요"}</h1>
                        <div className="text-sm text-muted-foreground mb-6">
                          버전: {formData.version} | 시행일: {new Date().toLocaleDateString('ko-KR')}
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
              <Button type="submit" size="lg" disabled={updateMutation.isPending}>
                <Save className="w-4 h-4 mr-2" />
                새 버전 저장 및 적용
              </Button>
              <Button type="button" variant="outline" size="lg" onClick={() => setIsEditing(false)}>
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
        <div>
          <h1 className="text-3xl font-bold">약관 및 정책 관리</h1>
          <p className="text-muted-foreground">
            이용약관 및 개인정보처리방침을 관리하고 버전을 추적합니다
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "terms" | "privacy")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="terms">
              <FileText className="w-4 h-4 mr-2" />
              이용약관
            </TabsTrigger>
            <TabsTrigger value="privacy">
              <Shield className="w-4 h-4 mr-2" />
              개인정보처리방침
            </TabsTrigger>
          </TabsList>

          <TabsContent value="terms" className="space-y-4">
            {currentDoc && (
              <Card className="border-primary">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>현재 활성 버전</CardTitle>
                      <CardDescription>
                        버전: {currentDoc.version} | 시행일:{" "}
                        {new Date(currentDoc.effective_date).toLocaleDateString("ko-KR")}
                      </CardDescription>
                    </div>
                    <Button onClick={() => setIsEditing(true)} size="lg">
                      새 버전 작성
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <h3 className="font-semibold mb-2">{currentDoc.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {currentDoc.content}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {history.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>버전 히스토리</CardTitle>
                  <CardDescription>
                    총 {history.length}개의 버전 • 과거 버전을 확인하고 복원할 수 있습니다
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {history.map((doc) => (
                      <div
                        key={doc.id}
                        className={`flex items-center justify-between p-4 border rounded-lg ${
                          doc.is_active ? 'bg-primary/5 border-primary' : 'hover:bg-muted/50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">
                              버전 {doc.version}
                              {doc.is_active && (
                                <span className="ml-2 px-2 py-0.5 text-xs rounded bg-primary text-primary-foreground">
                                  현재 활성
                                </span>
                              )}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(doc.effective_date).toLocaleDateString("ko-KR")} 시행
                            </p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => loadVersion(doc)}
                        >
                          이 버전 불러오기
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="privacy" className="space-y-4">
            {currentDoc && (
              <Card className="border-primary">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>현재 활성 버전</CardTitle>
                      <CardDescription>
                        버전: {currentDoc.version} | 시행일:{" "}
                        {new Date(currentDoc.effective_date).toLocaleDateString("ko-KR")}
                      </CardDescription>
                    </div>
                    <Button onClick={() => setIsEditing(true)} size="lg">
                      새 버전 작성
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <h3 className="font-semibold mb-2">{currentDoc.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {currentDoc.content}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {history.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>버전 히스토리</CardTitle>
                  <CardDescription>
                    총 {history.length}개의 버전 • 과거 버전을 확인하고 복원할 수 있습니다
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {history.map((doc) => (
                      <div
                        key={doc.id}
                        className={`flex items-center justify-between p-4 border rounded-lg ${
                          doc.is_active ? 'bg-primary/5 border-primary' : 'hover:bg-muted/50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">
                              버전 {doc.version}
                              {doc.is_active && (
                                <span className="ml-2 px-2 py-0.5 text-xs rounded bg-primary text-primary-foreground">
                                  현재 활성
                                </span>
                              )}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(doc.effective_date).toLocaleDateString("ko-KR")} 시행
                            </p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => loadVersion(doc)}
                        >
                          이 버전 불러오기
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default LegalDocuments;

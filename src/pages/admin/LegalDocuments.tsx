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
import { Save, FileText, Shield, Eye, Clock } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

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
  const [previewDoc, setPreviewDoc] = useState<LegalDocument | null>(null);
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

  // 현재 활성 문서를 폼에 로드
  useEffect(() => {
    const currentDoc = activeTab === "terms" ? activeTerms : activePrivacy;
    if (currentDoc && !formData.content) {
      setFormData({
        title: currentDoc.title,
        content: currentDoc.content,
        version: currentDoc.version,
      });
    }
  }, [activeTab, activeTerms, activePrivacy]);

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
    },
    onError: () => toast.error("문서 업데이트 실패"),
  });

  const loadCurrentVersion = () => {
    const currentDoc = activeTab === "terms" ? activeTerms : activePrivacy;
    if (currentDoc) {
      setFormData({
        title: currentDoc.title,
        content: currentDoc.content,
        version: currentDoc.version,
      });
      toast.success("현재 버전이 로드되었습니다");
    }
  };

  const loadVersion = (doc: LegalDocument) => {
    setFormData({
      title: doc.title,
      content: doc.content,
      version: doc.version,
    });
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
    if (window.confirm(`새 버전 ${nextVersion}으로 저장하시겠습니까?`)) {
      updateMutation.mutate({ 
        type: activeTab, 
        data: { ...formData, version: nextVersion }
      });
    }
  };

  const incrementVersion = (version: string): string => {
    const parts = version.split('.');
    if (parts.length === 2) {
      const [major, minor] = parts;
      return `${major}.${parseInt(minor) + 1}`;
    }
    return `${version}.1`;
  };

  const renderEditor = (currentDoc: LegalDocument | undefined, history: LegalDocument[]) => (
    <div className="space-y-4">
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
              <div className="flex gap-2">
                <Button onClick={() => setPreviewDoc(currentDoc)} variant="outline">
                  <Eye className="w-4 h-4 mr-2" />
                  미리보기
                </Button>
                <Button onClick={loadCurrentVersion} variant="outline">
                  <FileText className="w-4 h-4 mr-2" />
                  불러오기
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>문서 편집</CardTitle>
          <CardDescription>
            새 버전을 작성하면 기존 버전은 자동으로 비활성화되며, 버전 히스토리에 보관됩니다
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">문서 제목</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="윈들리아카데미 이용약관"
                />
              </div>

              <div>
                <Label htmlFor="version">버전</Label>
                <Input
                  id="version"
                  value={formData.version}
                  onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                  placeholder="1.0"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  저장 시 자동으로 버전이 증가합니다
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
                rows={20}
                className="font-mono text-sm"
              />
              <p className="text-sm text-muted-foreground mt-2">
                💡 팁: 줄바꿈(Enter)과 빈 줄이 그대로 적용됩니다. 표, 목록 등의 구조를 유지하세요.
              </p>
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={updateMutation.isPending}>
                <Save className="w-4 h-4 mr-2" />
                새 버전 저장 및 적용
              </Button>
              {formData.content && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setPreviewDoc({
                    ...formData,
                    id: "preview",
                    document_type: activeTab,
                    effective_date: new Date().toISOString(),
                    is_active: false,
                    created_at: new Date().toISOString()
                  } as LegalDocument)}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  미리보기
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {history.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>버전 히스토리</CardTitle>
            <CardDescription>
              과거 버전을 확인하고 불러올 수 있습니다
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {history.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">
                        버전 {doc.version}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(doc.effective_date).toLocaleDateString("ko-KR")} 시행
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {doc.is_active && (
                      <span className="px-2 py-1 text-xs rounded bg-primary text-primary-foreground">
                        현재 활성
                      </span>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setPreviewDoc(doc)}
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      보기
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => loadVersion(doc)}
                    >
                      <FileText className="w-3 h-3 mr-1" />
                      불러오기
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

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
            {renderEditor(activeTerms, termsHistory)}
          </TabsContent>

          <TabsContent value="privacy" className="space-y-4">
            {renderEditor(activePrivacy, privacyHistory)}
          </TabsContent>
        </Tabs>
      </div>

      {/* 미리보기 Dialog */}
      <Dialog open={!!previewDoc} onOpenChange={() => setPreviewDoc(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">
              {previewDoc?.title} (버전 {previewDoc?.version})
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <div className="text-sm text-muted-foreground mb-4">
              {previewDoc && new Date(previewDoc.effective_date).toLocaleDateString('ko-KR')} 시행
            </div>
            <div className="whitespace-pre-wrap leading-relaxed text-sm">
              {previewDoc?.content}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default LegalDocuments;
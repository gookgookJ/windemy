import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/layouts/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Save, FileText, Shield } from "lucide-react";
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
      setFormData({ title: "", content: "", version: "" });
    },
    onError: () => {
      toast.error("문서 업데이트 실패");
    },
  });

  const handleLoad = (doc: LegalDocument | undefined) => {
    if (doc) {
      setFormData({
        title: doc.title,
        content: doc.content,
        version: doc.version,
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim() || !formData.version.trim()) {
      toast.error("모든 필드를 입력해주세요");
      return;
    }

    updateMutation.mutate({ type: activeTab, data: formData });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">약관 및 정책 관리</h1>
          <p className="text-muted-foreground">
            이용약관 및 개인정보처리방침을 관리합니다
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
            {activeTerms && (
              <Card>
                <CardHeader>
                  <CardTitle>현재 활성 버전</CardTitle>
                  <CardDescription>
                    버전: {activeTerms.version} | 시행일:{" "}
                    {new Date(activeTerms.effective_date).toLocaleDateString("ko-KR")}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={() => handleLoad(activeTerms)} variant="outline">
                    현재 버전 불러오기
                  </Button>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>이용약관 업데이트</CardTitle>
                <CardDescription>
                  새 버전의 이용약관을 작성하면 기존 버전은 자동으로 비활성화됩니다
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="terms-title">제목</Label>
                    <Input
                      id="terms-title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="윈들리아카데미 이용약관"
                    />
                  </div>

                  <div>
                    <Label htmlFor="terms-version">버전</Label>
                    <Input
                      id="terms-version"
                      value={formData.version}
                      onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                      placeholder="1.0"
                    />
                  </div>

                  <div>
                    <Label htmlFor="terms-content">내용</Label>
                    <Textarea
                      id="terms-content"
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      placeholder="이용약관 내용을 입력하세요"
                      rows={20}
                    />
                  </div>

                  <Button type="submit" disabled={updateMutation.isPending}>
                    <Save className="w-4 h-4 mr-2" />
                    새 버전 적용
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="privacy" className="space-y-4">
            {activePrivacy && (
              <Card>
                <CardHeader>
                  <CardTitle>현재 활성 버전</CardTitle>
                  <CardDescription>
                    버전: {activePrivacy.version} | 시행일:{" "}
                    {new Date(activePrivacy.effective_date).toLocaleDateString("ko-KR")}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={() => handleLoad(activePrivacy)} variant="outline">
                    현재 버전 불러오기
                  </Button>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>개인정보처리방침 업데이트</CardTitle>
                <CardDescription>
                  새 버전의 개인정보처리방침을 작성하면 기존 버전은 자동으로 비활성화됩니다
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="privacy-title">제목</Label>
                    <Input
                      id="privacy-title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="개인정보 처리방침"
                    />
                  </div>

                  <div>
                    <Label htmlFor="privacy-version">버전</Label>
                    <Input
                      id="privacy-version"
                      value={formData.version}
                      onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                      placeholder="1.0"
                    />
                  </div>

                  <div>
                    <Label htmlFor="privacy-content">내용</Label>
                    <Textarea
                      id="privacy-content"
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      placeholder="개인정보처리방침 내용을 입력하세요"
                      rows={20}
                    />
                  </div>

                  <Button type="submit" disabled={updateMutation.isPending}>
                    <Save className="w-4 h-4 mr-2" />
                    새 버전 적용
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {!isLoading && documents && (
          <Card>
            <CardHeader>
              <CardTitle>버전 히스토리</CardTitle>
              <CardDescription>
                모든 문서 버전의 히스토리를 확인할 수 있습니다
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">
                        {doc.document_type === "terms" ? "이용약관" : "개인정보처리방침"} v
                        {doc.version}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(doc.effective_date).toLocaleDateString("ko-KR")}
                      </p>
                    </div>
                    {doc.is_active && (
                      <span className="px-2 py-1 text-xs rounded bg-primary text-primary-foreground">
                        현재 활성
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
};

export default LegalDocuments;
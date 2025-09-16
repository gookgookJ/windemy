import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const ExternalLink = () => {
  const [params] = useSearchParams();
  const { toast } = useToast();
  const [triedAuto, setTriedAuto] = useState(false);

  const url = useMemo(() => params.get("u") || "", [params]);
  const label = useMemo(() => params.get("label") || "외부 링크", [params]);

  const inIframe = typeof window !== "undefined" && window.self !== window.top;

  useEffect(() => {
    // If not in iframe (production/site), navigate directly
    if (!inIframe && url) {
      window.location.replace(url);
    }
  }, [inIframe, url]);

  const openInNewTab = () => {
    if (!url) return;

    try {
      if (window.top && window.top !== window.self) {
        (window.top as Window).location.href = url;
        return;
      }
    } catch (_) {}

    const newWin = window.open(url, "_blank", "noopener,noreferrer");
    if (newWin) return;

    const a = document.createElement("a");
    a.href = url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    a.remove();

    toast({
      title: "새 탭 열기가 차단되었습니다",
      description: "링크를 복사해 새 탭에서 직접 열어주세요.",
    });
  };

  const copyUrl = async () => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      toast({ title: "링크 복사 완료", description: "클립보드에 복사되었습니다." });
    } catch {
      toast({ title: "복사 실패", description: url });
    }
  };

  // Try auto-open once after render (still requires user gesture in many environments)
  useEffect(() => {
    if (!triedAuto && inIframe && url) {
      setTriedAuto(true);
      // Do nothing; explicit user click is more reliable in preview iframe
    }
  }, [triedAuto, inIframe, url]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-20">
        <h1 className="text-2xl font-bold text-foreground mb-2">{label}</h1>
        <p className="text-muted-foreground mb-6">
          미리보기 환경에서는 외부 사이트가 차단될 수 있어요. 아래 버튼을 눌러 새 탭에서 열어주세요.
        </p>
        <div className="flex gap-3">
          <Button variant="default" size="lg" onClick={openInNewTab}>
            새 탭에서 열기
          </Button>
          <Button variant="outline" size="lg" onClick={copyUrl}>
            링크 복사
          </Button>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="underline text-primary self-center"
          >
            직접 열기
          </a>
        </div>
      </main>
    </div>
  );
};

export default ExternalLink;

import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

const AuthCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState<"checking" | "success" | "error">("checking");
  const [message, setMessage] = useState<string>("인증 상태를 확인하고 있습니다...");

  useEffect(() => {
    document.title = "이메일 인증 | 윈들리아카데미";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", "이메일 인증 및 비밀번호 재설정 확인 페이지");
  }, []);

  useEffect(() => {
    // Supabase JS will automatically detect and store sessions from URL hash by default
    const process = async () => {
      try {
        // If the URL contains an error from Supabase, show it
        const params = new URLSearchParams(location.search);
        const urlError = params.get("error_description") || params.get("error");
        if (urlError) {
          setStatus("error");
          setMessage(`인증에 실패했습니다: ${urlError}`);
          return;
        }

        // Give Supabase a tick to parse the hash and persist the session
        setTimeout(async () => {
          const { data } = await supabase.auth.getSession();
          if (data.session) {
            setStatus("success");
            setMessage("이메일 인증이 완료되었습니다. 환영합니다!");
          } else {
            setStatus("error");
            setMessage("인증 정보를 확인하지 못했습니다. 이미 인증되었거나 링크가 만료되었을 수 있습니다.");
          }
        }, 0);
      } catch (e: any) {
        setStatus("error");
        setMessage("인증 처리 중 오류가 발생했습니다.");
      }
    };

    process();
  }, [location.search]);

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-20">
      <article className="w-full max-w-md rounded-2xl border bg-background/50 backdrop-blur p-8 text-center shadow-sm">
        <header className="mb-4">
          <h1 className="text-2xl font-bold">{status === "success" ? "인증 완료" : status === "error" ? "인증 실패" : "인증 확인 중"}</h1>
        </header>
        <p className="text-muted-foreground mb-8 whitespace-pre-line">{message}</p>
        <div className="flex gap-3 justify-center">
          <Button onClick={() => navigate("/")}>홈으로</Button>
          {status === "success" && (
            <Button variant="secondary" onClick={() => navigate("/my-page")}>마이페이지</Button>
          )}
        </div>
        <aside className="mt-6 text-xs text-muted-foreground">
          이메일을 열어 인증을 다시 시도하시거나, 문제가 지속되면 고객센터에 문의해주세요.
        </aside>
      </article>
    </main>
  );
};

export default AuthCallback;

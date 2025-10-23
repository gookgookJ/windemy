import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY") as string);

interface EmailData {
  email_data: {
    token: string;
    token_hash: string;
    redirect_to: string;
    email_action_type: string;
  };
  user: {
    email: string;
    id: string;
  };
}

const getEmailTemplate = (type: string, token: string, redirectUrl: string) => {
  const baseUrl = Deno.env.get("SUPABASE_URL");
  const verifyUrl = `${baseUrl}/auth/v1/verify?token=${token}&type=${type}&redirect_to=${redirectUrl}`;

  if (type === "signup") {
    return {
      subject: "윈들리아카데미 메일인증 안내입니다.",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              text-align: center;
              padding: 30px 0;
              border-bottom: 2px solid #f0f0f0;
            }
            .logo {
              font-size: 24px;
              font-weight: bold;
              color: #2563eb;
            }
            .title {
              font-size: 28px;
              font-weight: bold;
              margin: 30px 0 10px 0;
            }
            .title-accent {
              color: #10b981;
            }
            .content {
              padding: 30px 0;
            }
            .greeting {
              font-size: 16px;
              margin-bottom: 20px;
            }
            .instruction {
              font-size: 15px;
              color: #666;
              margin-bottom: 30px;
              line-height: 1.8;
            }
            .button-container {
              text-align: left;
              margin: 30px 0;
            }
            .verify-button {
              display: inline-block;
              background-color: #10b981;
              color: white;
              padding: 14px 40px;
              text-decoration: none;
              border-radius: 8px;
              font-weight: 600;
              font-size: 16px;
            }
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
              font-size: 13px;
              color: #6b7280;
            }
            .link {
              color: #2563eb;
              word-break: break-all;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">윈들리아카데미</div>
          </div>
          
          <div class="content">
            <h1 class="title"><span class="title-accent">메일인증</span> 안내입니다.</h1>
            
            <p class="greeting">안녕하세요.</p>
            
            <p class="instruction">
              윈들리아카데미를 이용해 주셔서 진심으로 감사드립니다.<br>
              아래 '<strong>메일 인증</strong>' 버튼을 클릭하여 회원가입을 완료해 주세요.<br>
              감사합니다.
            </p>
            
            <div class="button-container">
              <a href="${verifyUrl}" class="verify-button">메일 인증</a>
            </div>
            
            <div class="footer">
              만약 버튼이 정상적으로 클릭되지 않는다면, 아래 링크를 복사하여 접속해 주세요.<br>
              <a href="${verifyUrl}" class="link">${verifyUrl}</a>
            </div>
          </div>
        </body>
        </html>
      `,
    };
  }

  if (type === "recovery") {
    return {
      subject: "윈들리아카데미 비밀번호 재설정 안내",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              text-align: center;
              padding: 30px 0;
              border-bottom: 2px solid #f0f0f0;
            }
            .logo {
              font-size: 24px;
              font-weight: bold;
              color: #2563eb;
            }
            .title {
              font-size: 28px;
              font-weight: bold;
              margin: 30px 0 10px 0;
            }
            .content {
              padding: 30px 0;
            }
            .instruction {
              font-size: 15px;
              color: #666;
              margin-bottom: 30px;
              line-height: 1.8;
            }
            .button-container {
              text-align: left;
              margin: 30px 0;
            }
            .verify-button {
              display: inline-block;
              background-color: #2563eb;
              color: white;
              padding: 14px 40px;
              text-decoration: none;
              border-radius: 8px;
              font-weight: 600;
              font-size: 16px;
            }
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
              font-size: 13px;
              color: #6b7280;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">윈들리아카데미</div>
          </div>
          
          <div class="content">
            <h1 class="title">비밀번호 재설정</h1>
            
            <p class="instruction">
              비밀번호 재설정을 요청하셨습니다.<br>
              아래 버튼을 클릭하여 새로운 비밀번호를 설정해주세요.
            </p>
            
            <div class="button-container">
              <a href="${verifyUrl}" class="verify-button">비밀번호 재설정</a>
            </div>
            
            <div class="footer">
              본인이 요청하지 않은 경우, 이 이메일을 무시하셔도 됩니다.
            </div>
          </div>
        </body>
        </html>
      `,
    };
  }

  return {
    subject: "윈들리아카데미 이메일 인증",
    html: `<p>이메일 인증이 필요합니다.</p><p><a href="${verifyUrl}">여기를 클릭하세요</a></p>`,
  };
};

serve(async (req: Request) => {
  try {
    const payload: EmailData = await req.json();
    const { email_data, user } = payload;
    const { token, redirect_to, email_action_type } = email_data;

    const { subject, html } = getEmailTemplate(
      email_action_type,
      token,
      redirect_to
    );

    const { error } = await resend.emails.send({
      from: "윈들리아카데미 <onboarding@resend.dev>",
      to: [user.email],
      subject,
      html,
    });

    if (error) {
      throw error;
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Email sending error:", error);
    return new Response(
      JSON.stringify({
        error: {
          message: error.message,
        },
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});

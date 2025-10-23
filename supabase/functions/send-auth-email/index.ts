import React from 'npm:react@18.3.1'
import { Webhook } from 'https://esm.sh/standardwebhooks@1.0.0'
import { Resend } from 'npm:resend@4.0.0'
import { renderAsync } from 'npm:@react-email/components@0.0.22'
import { VerificationEmail } from './_templates/verification-email.tsx'
import { PasswordResetEmail } from './_templates/password-reset-email.tsx'

const resend = new Resend(Deno.env.get('RESEND_API_KEY') as string)

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const payload = await req.json()
    
    console.log('Received auth email request:', {
      type: payload.email_data?.email_action_type,
      email: payload.user?.email
    })

    const {
      user,
      email_data: { token, token_hash, redirect_to, email_action_type },
    } = payload

    if (!user?.email) {
      throw new Error('User email not found')
    }

    let html: string
    let subject: string

    // 이메일 타입에 따라 다른 템플릿 사용
    if (email_action_type === 'signup') {
      subject = '윈들리아카데미 이메일 인증'
      html = await renderAsync(
        React.createElement(VerificationEmail, {
          token,
          token_hash,
          redirect_to,
          email_action_type,
          supabase_url: Deno.env.get('SUPABASE_URL') ?? '',
          user_email: user.email,
        })
      )
    } else if (email_action_type === 'recovery' || email_action_type === 'password_reset') {
      subject = '윈들리아카데미 비밀번호 재설정'
      html = await renderAsync(
        React.createElement(PasswordResetEmail, {
          token,
          token_hash,
          redirect_to,
          email_action_type,
          supabase_url: Deno.env.get('SUPABASE_URL') ?? '',
          user_email: user.email,
        })
      )
    } else {
      // 기본 이메일 (다른 타입의 경우)
      subject = '윈들리아카데미 인증'
      html = await renderAsync(
        React.createElement(VerificationEmail, {
          token,
          token_hash,
          redirect_to,
          email_action_type,
          supabase_url: Deno.env.get('SUPABASE_URL') ?? '',
          user_email: user.email,
        })
      )
    }

    const { data, error } = await resend.emails.send({
      from: '윈들리아카데미 <onboarding@resend.dev>',
      to: [user.email],
      subject,
      html,
    })

    if (error) {
      console.error('Resend error:', error)
      throw error
    }

    console.log('Email sent successfully:', data)

    return new Response(
      JSON.stringify({ success: true, data }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  } catch (error: any) {
    console.error('Error in send-auth-email function:', error)
    return new Response(
      JSON.stringify({
        error: {
          message: error.message,
          details: error,
        },
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
})

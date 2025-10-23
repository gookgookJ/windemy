import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
  Section,
  Hr,
} from 'npm:@react-email/components@0.0.22'
import * as React from 'npm:react@18.3.1'

interface VerificationEmailProps {
  token: string
  token_hash: string
  redirect_to: string
  email_action_type: string
  supabase_url: string
  user_email: string
}

export const VerificationEmail = ({
  token,
  token_hash,
  redirect_to,
  email_action_type,
  supabase_url,
  user_email,
}: VerificationEmailProps) => {
  const verifyUrl = `${supabase_url}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${redirect_to}`
  
  return (
    <Html>
      <Head />
      <Preview>윈들리아카데미 이메일 인증</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>이메일 인증</Heading>
          <Text style={text}>
            윈들리아카데미에 가입해 주셔서 감사합니다!
          </Text>
          <Text style={text}>
            아래 버튼을 클릭하여 이메일 인증을 완료해주세요.
          </Text>
          <Section style={buttonContainer}>
            <Link href={verifyUrl} style={button}>
              이메일 인증하기
            </Link>
          </Section>
          <Text style={text}>
            또는 아래 인증 코드를 입력해주세요:
          </Text>
          <code style={code}>{token}</code>
          <Hr style={hr} />
          <Text style={footer}>
            이 이메일은 {user_email}으로 발송되었습니다.
            <br />
            본인이 요청하지 않은 경우 이 이메일을 무시하셔도 됩니다.
          </Text>
          <Text style={footer}>
            윈들리아카데미 드림
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export default VerificationEmail

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
}

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '40px 0',
  padding: '0 48px',
}

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
  padding: '0 48px',
}

const buttonContainer = {
  padding: '27px 48px',
}

const button = {
  backgroundColor: '#2563eb',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  padding: '12px 20px',
}

const code = {
  display: 'inline-block',
  padding: '16px 4.5%',
  width: '90.5%',
  backgroundColor: '#f4f4f4',
  borderRadius: '5px',
  border: '1px solid #eee',
  color: '#333',
  fontSize: '20px',
  fontWeight: 'bold',
  textAlign: 'center' as const,
  margin: '0 48px',
}

const hr = {
  borderColor: '#e6ebf1',
  margin: '20px 0',
}

const footer = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '16px',
  padding: '0 48px',
}

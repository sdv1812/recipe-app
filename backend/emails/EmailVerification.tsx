import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

interface EmailVerificationProps {
  verificationUrl: string;
  email: string;
}

export const EmailVerification = ({
  verificationUrl,
  email,
}: EmailVerificationProps) => (
  <Html>
    <Head />
    <Preview>Verify your email address for SousAI</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>🍳 Welcome to SousAI!</Heading>
        <Text style={text}>Hi there,</Text>
        <Text style={text}>
          Thank you for signing up for SousAI, your AI-powered cooking
          assistant! We're excited to have you on board.
        </Text>
        <Text style={text}>
          To get started and ensure the security of your account, please verify
          your email address by clicking the button below:
        </Text>
        <Section style={buttonContainer}>
          <Button style={button} href={verificationUrl}>
            Verify Email Address
          </Button>
        </Section>
        <Text style={text}>Or copy and paste this link into your browser:</Text>
        <Link href={verificationUrl} style={link}>
          {verificationUrl}
        </Link>
        <Text style={footer}>
          This verification link will expire in 24 hours. If you didn't create
          an account with SousAI, you can safely ignore this email.
        </Text>
        <Text style={footer}>
          Best regards,
          <br />
          The SousAI Team
        </Text>
      </Container>
    </Body>
  </Html>
);

export default EmailVerification;

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
};

const h1 = {
  color: "#333",
  fontSize: "24px",
  fontWeight: "bold",
  margin: "40px 0",
  padding: "0 40px",
  textAlign: "center" as const,
};

const text = {
  color: "#333",
  fontSize: "16px",
  lineHeight: "26px",
  padding: "0 40px",
};

const buttonContainer = {
  padding: "27px 40px",
};

const button = {
  backgroundColor: "#667eea",
  borderRadius: "8px",
  color: "#fff",
  fontSize: "16px",
  fontWeight: "bold",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "block",
  padding: "14px 20px",
};

const link = {
  color: "#667eea",
  fontSize: "14px",
  textDecoration: "underline",
  padding: "0 40px",
  wordBreak: "break-all" as const,
};

const footer = {
  color: "#8898aa",
  fontSize: "14px",
  lineHeight: "24px",
  padding: "0 40px",
  marginTop: "24px",
};

import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Button,
  Heading,
  Link,
} from "@react-email/components";
import * as React from "react";

interface PasswordResetEmailProps {
  resetLink: string;
  userName?: string;
}

export default function PasswordResetEmail({
  resetLink,
  userName,
}: PasswordResetEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Section style={section}>
            <Heading style={heading}>Reset Your Password</Heading>

            <Text style={text}>
              {userName ? `Hi ${userName},` : "Hi there,"}
            </Text>

            <Text style={text}>
              We received a request to reset your password for your RecipeApp
              account. Click the button below to create a new password:
            </Text>

            <Button style={button} href={resetLink}>
              Reset Password
            </Button>

            <Text style={text}>
              Or copy and paste this link into your browser:
            </Text>

            <Link href={resetLink} style={link}>
              {resetLink}
            </Link>

            <Text style={text}>
              This link will expire in 1 hour for security reasons.
            </Text>

            <Text style={text}>
              If you didn't request a password reset, you can safely ignore this
              email. Your password will remain unchanged.
            </Text>

            <Text style={footer}>
              Best regards,
              <br />
              The RecipeApp Team
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

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

const section = {
  padding: "0 48px",
};

const heading = {
  fontSize: "32px",
  lineHeight: "1.3",
  fontWeight: "700",
  color: "#484848",
  marginBottom: "24px",
};

const text = {
  fontSize: "16px",
  lineHeight: "26px",
  color: "#484848",
  marginBottom: "16px",
};

const button = {
  backgroundColor: "#5469d4",
  borderRadius: "5px",
  color: "#fff",
  fontSize: "16px",
  fontWeight: "bold",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "block",
  width: "100%",
  padding: "12px",
  marginTop: "24px",
  marginBottom: "24px",
};

const link = {
  color: "#5469d4",
  fontSize: "14px",
  textDecoration: "underline",
  wordBreak: "break-all" as const,
};

const footer = {
  fontSize: "14px",
  lineHeight: "24px",
  color: "#666",
  marginTop: "32px",
};

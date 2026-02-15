import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Heading,
} from "@react-email/components";
import * as React from "react";

interface PasswordChangedEmailProps {
  userName?: string;
}

export default function PasswordChangedEmail({
  userName,
}: PasswordChangedEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Section style={section}>
            <Heading style={heading}>Password Changed Successfully</Heading>

            <Text style={text}>
              {userName ? `Hi ${userName},` : "Hi there,"}
            </Text>

            <Text style={text}>
              This email confirms that your RecipeApp password was successfully
              changed.
            </Text>

            <Text style={text}>
              If you made this change, no further action is needed.
            </Text>

            <Text style={alertText}>
              <strong>Didn't change your password?</strong>
              <br />
              If you didn't make this change, please contact our support team
              immediately and secure your account.
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

const alertText = {
  fontSize: "16px",
  lineHeight: "26px",
  color: "#484848",
  backgroundColor: "#fff3cd",
  border: "1px solid #ffc107",
  borderRadius: "5px",
  padding: "16px",
  marginTop: "24px",
  marginBottom: "24px",
};

const footer = {
  fontSize: "14px",
  lineHeight: "24px",
  color: "#666",
  marginTop: "32px",
};

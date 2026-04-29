import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";

export type TransactionalEmailProps = {
  bodyParagraphs: readonly string[];
  cta: { label: string; url: string } | null;
  ctaContextNote?: string;
  footerNote?: string;
  preheader: string;
  signOff?: string;
  title: string;
};

const palette = {
  background: "#f6f5f1",
  border: "#e2dfd8",
  brand: "#1f4d3a",
  brandSoft: "#2f6b51",
  body: "#252525",
  muted: "#5a5a5a",
  surface: "#ffffff",
} as const;

const fontStack =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";

export function TransactionalEmail({
  bodyParagraphs,
  cta,
  ctaContextNote,
  footerNote,
  preheader,
  signOff = "— The Mentor IB team",
  title,
}: TransactionalEmailProps) {
  return (
    <Html lang="en">
      <Head />
      <Preview>{preheader}</Preview>
      <Body
        style={{
          backgroundColor: palette.background,
          color: palette.body,
          fontFamily: fontStack,
          margin: 0,
          padding: "32px 0",
        }}
      >
        <Container
          style={{
            backgroundColor: palette.surface,
            border: `1px solid ${palette.border}`,
            borderRadius: "12px",
            margin: "0 auto",
            maxWidth: "560px",
            padding: "32px",
          }}
        >
          <Section>
            <Text
              style={{
                color: palette.brand,
                fontSize: "16px",
                fontWeight: 600,
                letterSpacing: "0.04em",
                margin: 0,
                textTransform: "uppercase",
              }}
            >
              Mentor IB
            </Text>
          </Section>

          <Section style={{ paddingTop: "24px" }}>
            <Text
              style={{
                color: palette.body,
                fontSize: "22px",
                fontWeight: 600,
                lineHeight: "30px",
                margin: 0,
              }}
            >
              {title}
            </Text>
          </Section>

          <Section style={{ paddingTop: "16px" }}>
            {bodyParagraphs.map((paragraph, index) => (
              <Text
                key={index}
                style={{
                  color: palette.body,
                  fontSize: "15px",
                  lineHeight: "24px",
                  margin: index === 0 ? 0 : "16px 0 0 0",
                }}
              >
                {paragraph}
              </Text>
            ))}
          </Section>

          {cta ? (
            <Section style={{ paddingTop: "24px" }}>
              <Button
                href={cta.url}
                style={{
                  backgroundColor: palette.brand,
                  borderRadius: "8px",
                  color: palette.surface,
                  display: "inline-block",
                  fontSize: "15px",
                  fontWeight: 600,
                  padding: "12px 20px",
                  textDecoration: "none",
                }}
              >
                {cta.label}
              </Button>
              {ctaContextNote ? (
                <Text
                  style={{
                    color: palette.muted,
                    fontSize: "13px",
                    lineHeight: "20px",
                    margin: "12px 0 0 0",
                  }}
                >
                  {ctaContextNote}
                </Text>
              ) : null}
            </Section>
          ) : null}

          <Hr
            style={{
              borderColor: palette.border,
              margin: "32px 0 24px 0",
            }}
          />

          <Section>
            <Text
              style={{
                color: palette.muted,
                fontSize: "13px",
                lineHeight: "20px",
                margin: 0,
              }}
            >
              {signOff}
            </Text>
            {footerNote ? (
              <Text
                style={{
                  color: palette.muted,
                  fontSize: "12px",
                  lineHeight: "18px",
                  margin: "12px 0 0 0",
                }}
              >
                {footerNote}
              </Text>
            ) : null}
            <Text
              style={{
                color: palette.muted,
                fontSize: "12px",
                lineHeight: "18px",
                margin: "12px 0 0 0",
              }}
            >
              You are receiving this transactional update because of activity on
              your Mentor IB account. Manage updates from{" "}
              <Link
                href={cta?.url ?? "https://mentorib.com/notifications"}
                style={{ color: palette.brandSoft }}
              >
                your notifications inbox
              </Link>
              .
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export default TransactionalEmail;

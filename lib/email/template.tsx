import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components"

type AppEmailTemplateProps = {
  preview: string
  title: string
  intro: string
  lines?: string[]
  ctaLabel?: string
  ctaUrl?: string
}

export function AppEmailTemplate({
  preview,
  title,
  intro,
  lines = [],
  ctaLabel,
  ctaUrl,
}: AppEmailTemplateProps) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body
        style={{
          backgroundColor: "#f6f6f6",
          fontFamily:
            "ui-sans-serif, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial",
          padding: "24px 0",
        }}
      >
        <Container
          style={{
            margin: "0 auto",
            backgroundColor: "#ffffff",
            borderRadius: "12px",
            border: "1px solid #e5e7eb",
            padding: "28px",
            maxWidth: "620px",
          }}
        >
          <Heading style={{ margin: "0 0 16px", fontSize: "22px" }}>{title}</Heading>
          <Text style={{ margin: "0 0 12px", color: "#334155", lineHeight: "24px" }}>
            {intro}
          </Text>
          {lines.map((line) => (
            <Text
              key={line}
              style={{ margin: "0 0 10px", color: "#475569", lineHeight: "22px" }}
            >
              {line}
            </Text>
          ))}
          {ctaLabel && ctaUrl ? (
            <Section style={{ marginTop: "20px" }}>
              <Button
                href={ctaUrl}
                style={{
                  backgroundColor: "#111827",
                  borderRadius: "8px",
                  color: "#ffffff",
                  textDecoration: "none",
                  padding: "10px 16px",
                  fontWeight: 600,
                }}
              >
                {ctaLabel}
              </Button>
            </Section>
          ) : null}
          <Hr style={{ margin: "24px 0", borderColor: "#e5e7eb" }} />
          <Text style={{ margin: 0, color: "#64748b", fontSize: "12px" }}>
            Agency Studio
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

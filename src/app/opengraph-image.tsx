import { ImageResponse } from "next/og";

export const alt = "Mentor IB";
export const contentType = "image/png";
export const size = {
  height: 630,
  width: 1200,
};

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "stretch",
          background:
            "linear-gradient(135deg, rgb(250, 244, 233) 0%, rgb(241, 221, 187) 45%, rgb(205, 125, 77) 100%)",
          color: "rgb(33, 22, 17)",
          display: "flex",
          flexDirection: "column",
          height: "100%",
          justifyContent: "space-between",
          padding: "72px",
          width: "100%",
        }}
      >
        <div
          style={{
            fontSize: 30,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
          }}
        >
          Mentor IB
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "24px",
            maxWidth: "880px",
          }}
        >
          <div
            style={{
              fontSize: 88,
              fontWeight: 700,
              lineHeight: 1,
            }}
          >
            Match-first IB tutoring.
          </div>
          <div
            style={{
              fontSize: 34,
              lineHeight: 1.3,
              opacity: 0.88,
            }}
          >
            Shared discovery, trust, and tutor profile routes with SEO-safe defaults.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            fontSize: 28,
            justifyContent: "space-between",
            letterSpacing: "0.04em",
            opacity: 0.92,
          }}
        >
          <span>mentorib.com</span>
          <span>Phase 1 foundation</span>
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}

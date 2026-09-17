import { ImageResponse } from "next/og";

export const alt = "Waakya · All your business work. One workspace.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** The link preview people see when waakya.com is shared in a chat. */
export default function OpengraphImage() {
  const stages = ["Conversation", "Commitment", "Execution", "Proof", "Record"];
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#FBFAF6",
          padding: "64px 72px",
          color: "#1B2060",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 40, fontWeight: 800 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
            <div style={{ width: 10, height: 26, borderRadius: 6, background: "#3541C4" }} />
            <div style={{ width: 10, height: 46, borderRadius: 6, background: "#3541C4" }} />
          </div>
          Waakya
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 24, letterSpacing: 4, color: "#3541C4", fontWeight: 700 }}>
            THE NEW ERA OF BUSINESS COMMUNICATION
          </div>
          <div style={{ fontSize: 76, fontWeight: 800, lineHeight: 1.05, marginTop: 18 }}>
            All your business work. One workspace.
          </div>
        </div>
        <div style={{ display: "flex", gap: 14, fontSize: 26, color: "#3E3A33" }}>
          {stages.map((stage, index) => (
            <div key={stage} style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ display: "flex", padding: "8px 18px", border: "2px solid #CDD2F7", borderRadius: 999, background: "#FFFFFF" }}>
                {stage}
              </div>
              {index < stages.length - 1 ? <div style={{ display: "flex", color: "#7A84E6" }}>→</div> : null}
            </div>
          ))}
        </div>
      </div>
    ),
    size,
  );
}

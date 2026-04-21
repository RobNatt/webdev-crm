"use client";

type Props = {
  message: string | null;
};

/** Short-lived status message (fixed bottom-right). */
export function Toast({ message }: Props) {
  if (!message) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        maxWidth: 320,
        background: "#0f3d2a",
        color: "#f4fff8",
        padding: "12px 16px",
        borderRadius: 10,
        boxShadow: "0 6px 24px rgba(0,0,0,0.25)",
        zIndex: 2000,
        fontSize: 14
      }}
    >
      {message}
    </div>
  );
}

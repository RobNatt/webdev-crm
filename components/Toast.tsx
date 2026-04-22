"use client";

import styles from "./Toast.module.css";

type Props = {
  message: string | null;
};

/** Short-lived status message (fixed bottom-right). */
export function Toast({ message }: Props) {
  if (!message) return null;
  return (
    <div role="status" aria-live="polite" className={styles.toast}>
      {message}
    </div>
  );
}

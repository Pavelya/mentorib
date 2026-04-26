import styles from "./google-mark.module.css";

type GoogleMarkProps = {
  className?: string;
};

export function GoogleMark({ className }: GoogleMarkProps) {
  return (
    <svg
      aria-hidden="true"
      className={[styles.googleMark, className].filter(Boolean).join(" ")}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M21.82 12.23c0-.72-.06-1.25-.2-1.81H12.2v3.44h5.53c-.11.85-.72 2.14-2.08 3l-.02.12 3.02 2.29.21.02c1.89-1.71 2.96-4.23 2.96-7.06Z"
        fill="#4285F4"
      />
      <path
        d="M12.2 21.89c2.71 0 4.98-.87 6.64-2.36l-3.21-2.43c-.86.59-2.01 1-3.43 1-2.66 0-4.92-1.71-5.72-4.08l-.12.01-3.13 2.38-.04.11a10.04 10.04 0 0 0 9.01 5.37Z"
        fill="#34A853"
      />
      <path
        d="M6.48 14.02a6.07 6.07 0 0 1-.34-2.02c0-.7.13-1.38.32-2.02l-.01-.14-3.18-2.42-.1.05A9.8 9.8 0 0 0 2.1 12c0 1.58.38 3.08 1.07 4.42l3.3-2.4Z"
        fill="#FBBC05"
      />
      <path
        d="M12.2 5.89c1.79 0 3 .76 3.69 1.4l2.69-2.57C17.17 3.43 14.9 2.1 12.2 2.1a10.04 10.04 0 0 0-9.03 5.37l3.29 2.51c.81-2.37 3.06-4.09 5.74-4.09Z"
        fill="#EA4335"
      />
    </svg>
  );
}

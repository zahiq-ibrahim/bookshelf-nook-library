import { useRef } from "react";

/** Six-digit OTP: numeric keypad, paste, auto-advance, onComplete on 6th digit. */
export function OtpInput({
  value, onChange, onComplete, disabled, invalid,
}: {
  value: string;
  onChange: (v: string) => void;
  onComplete?: (v: string) => void;
  disabled?: boolean;
  invalid?: boolean;
}) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = value.padEnd(6, " ").slice(0, 6).split("");

  const commit = (v: string) => {
    const clean = v.replace(/\D/g, "").slice(0, 6);
    onChange(clean);
    if (clean.length === 6) onComplete?.(clean);
    refs.current[Math.min(clean.length, 5)]?.focus();
  };

  return (
    <div className="otp" role="group" aria-label="Six-digit code">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          className={`otp__cell${invalid ? " is-invalid" : ""}`}
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          pattern="[0-9]*"
          maxLength={1}
          aria-label={`Digit ${i + 1}`}
          value={d.trim()}
          disabled={disabled}
          onChange={(e) => {
            const ch = e.target.value.replace(/\D/g, "");
            if (ch.length > 1) return commit(ch);
            if (!ch) return onChange(value.slice(0, i) + value.slice(i + 1));
            const arr = value.split("");
            arr[Math.min(i, value.length)] = ch;
            commit(arr.join(""));
          }}
          onKeyDown={(e) => {
            if (e.key === "Backspace" && !d.trim() && i > 0) {
              onChange(value.slice(0, i - 1));
              refs.current[i - 1]?.focus();
              e.preventDefault();
            }
          }}
          onPaste={(e) => { e.preventDefault(); commit(e.clipboardData.getData("text")); }}
        />
      ))}
    </div>
  );
}

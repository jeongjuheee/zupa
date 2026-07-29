import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
} from "react";

type ButtonVariant = "blue" | "yellow" | "outline" | "disabled";

export function AppHeader({
  title,
  onBack,
}: {
  title?: string;
  onBack?: () => void;
}) {
  return (
    <header className="ds-header">
      {onBack ? (
        <button className="ds-back" aria-label="뒤로" onClick={onBack}>
          ‹
        </button>
      ) : (
        <span className="ds-header-spacer" />
      )}
      <strong>{title ?? "Zupa"}</strong>
      <span className="ds-header-spacer" />
    </header>
  );
}

export function Button({
  variant = "blue",
  className = "",
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
}) {
  return (
    <button
      className={`ds-button ds-button--${variant} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function TextInput({
  label,
  error,
  trailing,
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  trailing?: ReactNode;
}) {
  return (
    <label className={`ds-field ${error ? "is-error" : ""} ${className}`}>
      <span className="ds-field__label">{label}</span>
      <span className="ds-field__control">
        <input className="ds-input" {...props} />
        {trailing ? (
          <span className="ds-field__trailing">{trailing}</span>
        ) : null}
      </span>
      {error ? <ErrorMessage>{error}</ErrorMessage> : null}
    </label>
  );
}

export function Checkbox({
  children,
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { children: ReactNode }) {
  return (
    <label className={`ds-checkbox ${className}`}>
      <input type="checkbox" {...props} />
      <span aria-hidden="true" />
      {children}
    </label>
  );
}

export function Divider({ children }: { children?: ReactNode }) {
  return <div className="ds-divider">{children}</div>;
}

export function ErrorMessage({ children }: { children: ReactNode }) {
  return (
    <p className="ds-error" role="alert">
      {children}
    </p>
  );
}

export function LinkText({
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className="ds-link" {...props}>
      {children}
    </button>
  );
}

export function BottomSheet({ children }: { children: ReactNode }) {
  return <section className="ds-bottom-sheet">{children}</section>;
}

export function LoadingIndicator({ label }: { label?: string }) {
  return (
    <div className="ds-loading" aria-live="polite">
      <i aria-hidden="true" />
      {label ? <span>{label}</span> : null}
    </div>
  );
}

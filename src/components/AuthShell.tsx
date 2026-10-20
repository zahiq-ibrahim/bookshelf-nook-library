import type { ReactNode } from "react";

export function AuthShell({ title, subtitle, children, footer }: {
  title: string; subtitle?: ReactNode; children: ReactNode; footer?: ReactNode;
}) {
  return (
    <main className="auth">
      <div className="auth__card">
        <p className="auth__brand">The Book Cabinet</p>
        <h1 className="auth__title">{title}</h1>
        {subtitle && <p className="auth__sub">{subtitle}</p>}
        {children}
        {footer && <div className="auth__footer">{footer}</div>}
      </div>
    </main>
  );
}

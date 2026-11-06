import type { Metadata } from "next";

// Admin pages depend on the session cookie, so navigations may block on the
// auth check rather than showing a prerendered shell.
export const instant = false;

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Admin | Jeevan Cars" },
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: LayoutProps<"/admin">) {
  return <div className="flex min-h-full flex-1 flex-col bg-paper">{children}</div>;
}

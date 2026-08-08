import Link from "next/link";

import { Logo } from "@/components/logo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-creme">
      <header className="px-4 py-6">
        <Link href="/" className="inline-block">
          <Logo className="h-8 w-auto" />
        </Link>
      </header>

      <main className="flex flex-1 items-start justify-center px-4 pb-16 pt-4 sm:items-center sm:pt-0">
        <div className="w-full max-w-md rounded-2xl border border-creme-200 bg-white p-6 shadow-sm sm:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}

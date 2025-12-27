import type { Metadata } from "next";
import { Toaster } from '@/components/ui/sonner'

export const metadata: Metadata = {
  title: "管理画面 | Kota Murai Life & Code",
  description: "管理画面",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="admin-layout min-h-screen bg-gray-50">
      {children}
      <Toaster position="top-right" richColors />
    </div>
  )
}

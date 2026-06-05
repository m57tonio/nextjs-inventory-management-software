import { redirect } from "next/navigation";
import { auth } from "@/auth";
import DashboardShell from "@/components/layout/DashboardShell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/");

  const userName    = session.user.name    ?? "User";
  const userInitial = userName.charAt(0).toUpperCase();

  return (
    <DashboardShell userName={userName} userInitial={userInitial}>
      {children}
    </DashboardShell>
  );
}

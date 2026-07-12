import { verifySession, deleteSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AdminDashboard() {
  const session = await verifySession();
  
  if (!session || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <header className="flex justify-between items-center border-b border-border pb-4">
          <div>
            <h1 className="text-3xl font-semibold">Admin Dashboard</h1>
            <p className="text-muted-foreground mt-1">Welcome back, {session.user.email}</p>
          </div>
          <form action={async () => {
            "use server";
            await deleteSession();
            redirect("/login");
          }}>
            <button className="px-4 py-2 bg-destructive/10 text-destructive rounded-lg hover:bg-destructive/20 font-medium">
              Logout
            </button>
          </form>
        </header>

        <section className="bg-card/40 border border-border p-6 rounded-2xl shadow-sm">
          <h2 className="text-xl font-medium mb-4">Employee Directory</h2>
          <p className="text-muted-foreground mb-4">Manage organization employees and their access credentials.</p>
          <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium">
            + Create New Employee
          </button>
        </section>
      </div>
    </div>
  );
}

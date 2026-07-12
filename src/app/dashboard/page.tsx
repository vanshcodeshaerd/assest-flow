import { verifySession, deleteSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function UserDashboard() {
  const session = await verifySession();
  
  if (!session || session.user.role !== "USER") {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <header className="flex justify-between items-center border-b border-border pb-4">
          <div>
            <h1 className="text-3xl font-semibold">User Dashboard</h1>
            <p className="text-muted-foreground mt-1">Welcome, {session.user.email}</p>
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
          <h2 className="text-xl font-medium mb-4">My Account</h2>
          <p className="text-muted-foreground mb-4">View your personal account details and saved information.</p>
          <div className="p-4 border border-border rounded-xl bg-background text-sm">
            <p><span className="font-semibold">Email:</span> {session.user.email}</p>
            <p><span className="font-semibold">Role:</span> Normal User</p>
          </div>
        </section>
      </div>
    </div>
  );
}

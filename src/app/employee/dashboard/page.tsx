import { verifySession, deleteSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function EmployeeDashboard() {
  const session = await verifySession();
  
  if (!session || session.user.role !== "EMPLOYEE") {
    redirect("/employee/login");
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <header className="flex justify-between items-center border-b border-border pb-4">
          <div>
            <h1 className="text-3xl font-semibold">Employee Dashboard</h1>
            <p className="text-muted-foreground mt-1">Welcome back, Employee {session.user.employeeId}</p>
          </div>
          <form action={async () => {
            "use server";
            await deleteSession();
            redirect("/employee/login");
          }}>
            <button className="px-4 py-2 bg-destructive/10 text-destructive rounded-lg hover:bg-destructive/20 font-medium">
              Logout
            </button>
          </form>
        </header>

        <section className="bg-card/40 border border-border p-6 rounded-2xl shadow-sm">
          <h2 className="text-xl font-medium mb-4">My Assets</h2>
          <p className="text-muted-foreground mb-4">View and manage assets assigned to you by your organization.</p>
          <div className="p-4 border border-border rounded-xl text-center text-sm text-muted-foreground">
            No assets currently assigned.
          </div>
        </section>
      </div>
    </div>
  );
}

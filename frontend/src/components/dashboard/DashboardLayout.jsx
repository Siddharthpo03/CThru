import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function DashboardLayout({ children }) {
  return (
    <div
      className="
        flex min-h-screen
        bg-zinc-50
        text-zinc-900
        dark:bg-zinc-950
        dark:text-white
      "
    >
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />

        <main className="flex-1 overflow-auto p-8">{children}</main>
      </div>
    </div>
  );
}

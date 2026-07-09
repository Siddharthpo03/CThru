import DashboardLayout from "../components/dashboard/DashboardLayout";
import StatsCard from "../components/dashboard/StatsCard";
import QuickActions from "../components/dashboard/QuickActions";
import RecentReviews from "../components/dashboard/RecentReviews";

import { FileCode2, CheckCircle2, Bug, Shield } from "lucide-react";

export default function Dashboard() {
  return (
    <DashboardLayout>
      <h1 className="text-4xl font-bold">Welcome back 👋</h1>

      <p className="mt-2 text-zinc-400">
        Here's an overview of your code reviews.
      </p>

      <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <StatsCard
          title="Reviews"
          value="18"
          subtitle="+5 this week"
          icon={FileCode2}
        />

        <StatsCard
          title="Passed"
          value="14"
          subtitle="78% success"
          icon={CheckCircle2}
        />

        <StatsCard
          title="Issues"
          value="37"
          subtitle="Needs fixing"
          icon={Bug}
        />

        <StatsCard
          title="Security"
          value="4"
          subtitle="Warnings"
          icon={Shield}
        />
      </div>

      <div className="mt-8">
        <QuickActions />
      </div>

      <div className="mt-8">
        <RecentReviews />
      </div>
    </DashboardLayout>
  );
}

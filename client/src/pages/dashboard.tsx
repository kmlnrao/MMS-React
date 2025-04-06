import AppLayout from "@/components/layout/app-layout";
import StatCard from "@/components/dashboard/stat-card";
import StorageUnitGrid from "@/components/dashboard/storage-unit-grid";
import RecentRegistrations from "@/components/dashboard/recent-registrations";
import PendingTasks from "@/components/dashboard/pending-tasks";
import SystemAlerts from "@/components/dashboard/system-alerts";
import QuickActions from "@/components/dashboard/quick-actions";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

export default function Dashboard() {
  const { data: dashboardData, isLoading, error } = useQuery({
    queryKey: ["/api/dashboard"],
  });
  
  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-medium text-primary">Dashboard</h1>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-500 p-4 rounded-lg">
          Error loading dashboard data: {error.message}
        </div>
      ) : (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <StatCard 
              title="Total Occupied"
              value={dashboardData.occupied}
              icon="document"
              change="12% from yesterday"
              changeType="increase"
              color="accent"
            />
            <StatCard 
              title="Available Capacity"
              value={dashboardData.available}
              icon="chart"
              change="3 units freed today"
              changeType="increase"
              color="success"
            />
            <StatCard 
              title="Pending Releases"
              value={dashboardData.pendingReleases}
              icon="clock"
              change="2 require immediate attention"
              changeType="neutral"
              color="warning"
            />
            <StatCard 
              title="Unclaimed Bodies"
              value={dashboardData.unclaimed}
              icon="alert"
              change="1 approaching legal limit"
              changeType="decrease"
              color="error"
            />
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main content area - 2/3 width on large screens */}
            <div className="lg:col-span-2 space-y-6">
              {/* Recent registrations */}
              <RecentRegistrations patients={dashboardData.recentRegistrations} />

              {/* Storage status visual representation */}
              <StorageUnitGrid />
            </div>

            {/* Sidebar - 1/3 width on large screens */}
            <div className="space-y-6">
              {/* Pending tasks */}
              <PendingTasks tasks={dashboardData.pendingTasks} />

              {/* System alerts */}
              <SystemAlerts alerts={dashboardData.alerts} />

              {/* Quick Actions */}
              <QuickActions />
            </div>
          </div>
        </>
      )}
    </AppLayout>
  );
}

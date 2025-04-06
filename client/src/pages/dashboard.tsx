import AppLayout from "@/components/layout/app-layout";
import StatCard from "@/components/dashboard/stat-card";
import StorageUnitGrid from "@/components/dashboard/storage-unit-grid";
import RecentRegistrations from "@/components/dashboard/recent-registrations";
import PendingTasks from "@/components/dashboard/pending-tasks";
import SystemAlerts from "@/components/dashboard/system-alerts";
import QuickActions from "@/components/dashboard/quick-actions";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Home, Clock, RefreshCw, CalendarDays } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface DashboardData {
  occupied: number;
  available: number;
  pendingReleases: number;
  unclaimed: number;
  recentRegistrations: any[];
  pendingTasks: any[];
  alerts: any[];
}

export default function Dashboard() {
  const { data: dashboardData, isLoading, error } = useQuery<DashboardData>({
    queryKey: ["/api/dashboard"],
  });
  
  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#e3f2fd]">
        <div>
          <h1 className="text-2xl font-semibold text-[#1565c0] mb-1">Dashboard</h1>
          <p className="text-sm text-[#64b5f6]">Mortuary Management System Overview</p>
        </div>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="border-[#bbdefb] text-[#1976d2] bg-[#f5f9ff] hover:bg-[#e3f2fd]"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="border-[#bbdefb] text-[#1976d2] bg-[#f5f9ff] hover:bg-[#e3f2fd]"
          >
            <CalendarDays className="mr-2 h-4 w-4" />
            Today
          </Button>
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-[#42a5f5]" />
        </div>
      ) : error ? (
        <Card className="bg-[#ffebee] text-[#ef5350] p-4 rounded-lg border-[#ef9a9a] shadow-sm">
          <div className="flex items-center">
            <span className="font-medium">Error loading dashboard data:</span>
            <span className="ml-2">{error.message}</span>
          </div>
        </Card>
      ) : dashboardData ? (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
            <StatCard 
              title="Total Occupied"
              value={dashboardData.occupied}
              icon="document"
              change="12% from yesterday"
              changeType="increase"
              color="bg-[#e3f2fd] text-[#1976d2] border-[#bbdefb]"
            />
            <StatCard 
              title="Available Capacity"
              value={dashboardData.available}
              icon="chart"
              change="3 units freed today"
              changeType="increase"
              color="bg-[#e8f5e9] text-[#43a047] border-[#a5d6a7]"
            />
            <StatCard 
              title="Pending Releases"
              value={dashboardData.pendingReleases}
              icon="clock"
              change="2 require immediate attention"
              changeType="neutral"
              color="bg-[#fff8e1] text-[#ffa000] border-[#ffecb3]"
            />
            <StatCard 
              title="Unclaimed Bodies"
              value={dashboardData.unclaimed}
              icon="alert"
              change="1 approaching legal limit"
              changeType="decrease"
              color="bg-[#ffebee] text-[#e53935] border-[#ef9a9a]"
            />
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main content area - 2/3 width on large screens */}
            <div className="lg:col-span-2 space-y-6">
              {/* Recent registrations */}
              <Card className="overflow-hidden border-[#e3f2fd] shadow-sm">
                <div className="bg-gradient-to-r from-[#e3f2fd] to-[#f5f9ff] px-6 py-4 border-b border-[#e3f2fd]">
                  <h2 className="text-[#1565c0] font-medium text-lg">Recent Registrations</h2>
                </div>
                <div className="p-1">
                  <RecentRegistrations patients={dashboardData.recentRegistrations} />
                </div>
              </Card>

              {/* Storage status visual representation */}
              <Card className="overflow-hidden border-[#e3f2fd] shadow-sm">
                <div className="bg-gradient-to-r from-[#e3f2fd] to-[#f5f9ff] px-6 py-4 border-b border-[#e3f2fd]">
                  <h2 className="text-[#1565c0] font-medium text-lg">Storage Unit Status</h2>
                </div>
                <div className="p-4">
                  <StorageUnitGrid />
                </div>
              </Card>
            </div>

            {/* Sidebar - 1/3 width on large screens */}
            <div className="space-y-6">
              {/* Pending tasks */}
              <Card className="overflow-hidden border-[#e3f2fd] shadow-sm">
                <div className="bg-gradient-to-r from-[#e3f2fd] to-[#f5f9ff] px-6 py-4 border-b border-[#e3f2fd]">
                  <h2 className="text-[#1565c0] font-medium text-lg">Pending Tasks</h2>
                </div>
                <div className="p-3">
                  <PendingTasks tasks={dashboardData.pendingTasks} />
                </div>
              </Card>

              {/* System alerts */}
              <Card className="overflow-hidden border-[#e3f2fd] shadow-sm">
                <div className="bg-gradient-to-r from-[#e3f2fd] to-[#f5f9ff] px-6 py-4 border-b border-[#e3f2fd]">
                  <h2 className="text-[#1565c0] font-medium text-lg">System Alerts</h2>
                </div>
                <div className="p-3">
                  <SystemAlerts alerts={dashboardData.alerts} />
                </div>
              </Card>

              {/* Quick Actions */}
              <Card className="overflow-hidden border-[#e3f2fd] shadow-sm">
                <div className="bg-gradient-to-r from-[#e3f2fd] to-[#f5f9ff] px-6 py-4 border-b border-[#e3f2fd]">
                  <h2 className="text-[#1565c0] font-medium text-lg">Quick Actions</h2>
                </div>
                <div className="p-4">
                  <QuickActions />
                </div>
              </Card>
            </div>
          </div>
        </>
      ) : (
        <Card className="bg-[#fff3e0] text-[#ff9800] p-4 rounded-lg border-[#ffcc80] shadow-sm">
          <div className="flex items-center">
            <span className="font-medium">No dashboard data available</span>
          </div>
        </Card>
      )}
    </AppLayout>
  );
}

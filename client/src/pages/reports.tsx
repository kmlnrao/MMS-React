import { useState } from "react";
import AppLayout from "@/components/layout/app-layout";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  DeceasedPatient, 
  StorageUnit, 
  BodyReleaseRequest, 
  Postmortem
} from "@shared/schema";
import { 
  Loader2, 
  BarChart3, 
  Download, 
  FileText, 
  PieChart, 
  Calendar,
  Clock
} from "lucide-react";
import { format, subMonths, isWithinInterval, startOfMonth, endOfMonth } from "date-fns";
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
} from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

// Chart colors
const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

export default function Reports() {
  const [reportPeriod, setReportPeriod] = useState("last30");
  const [startDate, setStartDate] = useState(format(subMonths(new Date(), 1), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"));
  
  // Load data
  const { data: patients, isLoading: isLoadingPatients } = useQuery<DeceasedPatient[]>({
    queryKey: ["/api/patients"],
  });
  
  const { data: storageUnits, isLoading: isLoadingStorage } = useQuery<StorageUnit[]>({
    queryKey: ["/api/storage-units"],
  });
  
  const { data: releaseRequests, isLoading: isLoadingReleases } = useQuery<BodyReleaseRequest[]>({
    queryKey: ["/api/releases"],
  });
  
  const { data: postmortems, isLoading: isLoadingPostmortems } = useQuery<Postmortem[]>({
    queryKey: ["/api/postmortems"],
  });
  
  const isLoading = isLoadingPatients || isLoadingStorage || isLoadingReleases || isLoadingPostmortems;
  
  // Handle report period changes
  const handlePeriodChange = (value: string) => {
    setReportPeriod(value);
    
    if (value === "custom") {
      // Keep current custom dates
      return;
    }
    
    const today = new Date();
    
    switch (value) {
      case "last7":
        setStartDate(format(subMonths(today, 0, 7), "yyyy-MM-dd"));
        setEndDate(format(today, "yyyy-MM-dd"));
        break;
      case "last30":
        setStartDate(format(subMonths(today, 1), "yyyy-MM-dd"));
        setEndDate(format(today, "yyyy-MM-dd"));
        break;
      case "last90":
        setStartDate(format(subMonths(today, 3), "yyyy-MM-dd"));
        setEndDate(format(today, "yyyy-MM-dd"));
        break;
      case "thisMonth":
        setStartDate(format(startOfMonth(today), "yyyy-MM-dd"));
        setEndDate(format(endOfMonth(today), "yyyy-MM-dd"));
        break;
      case "lastMonth":
        const lastMonth = subMonths(today, 1);
        setStartDate(format(startOfMonth(lastMonth), "yyyy-MM-dd"));
        setEndDate(format(endOfMonth(lastMonth), "yyyy-MM-dd"));
        break;
    }
  };
  
  // Get date-filtered data
  const getFilteredData = () => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999); // End of day
    
    const filteredPatients = patients?.filter(patient => 
      isWithinInterval(new Date(patient.registrationDate), { start, end })
    ) || [];
    
    const filteredReleases = releaseRequests?.filter(release => 
      isWithinInterval(new Date(release.requestDate), { start, end })
    ) || [];
    
    const filteredPostmortems = postmortems?.filter(postmortem => 
      postmortem.scheduledDate && 
      isWithinInterval(new Date(postmortem.scheduledDate), { start, end })
    ) || [];
    
    return { filteredPatients, filteredReleases, filteredPostmortems };
  };
  
  // Prepare data for charts
  const prepareChartData = () => {
    const { filteredPatients, filteredReleases, filteredPostmortems } = getFilteredData();
    
    // Patient status breakdown
    const statusData = [];
    const statusCounts: Record<string, number> = {};
    
    filteredPatients.forEach(patient => {
      statusCounts[patient.status] = (statusCounts[patient.status] || 0) + 1;
    });
    
    for (const [status, count] of Object.entries(statusCounts)) {
      statusData.push({
        name: status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        value: count
      });
    }
    
    // Origin ward breakdown
    const wardData = [];
    const wardCounts: Record<string, number> = {};
    
    filteredPatients.forEach(patient => {
      wardCounts[patient.wardFrom] = (wardCounts[patient.wardFrom] || 0) + 1;
    });
    
    for (const [ward, count] of Object.entries(wardCounts)) {
      wardData.push({
        name: ward,
        count: count
      });
    }
    
    // Release status
    const releaseStatusData = [];
    const releaseCounts = {
      approved: 0,
      pending: 0,
      rejected: 0
    };
    
    filteredReleases.forEach(release => {
      releaseCounts[release.approvalStatus] += 1;
    });
    
    for (const [status, count] of Object.entries(releaseCounts)) {
      releaseStatusData.push({
        name: status.charAt(0).toUpperCase() + status.slice(1),
        value: count
      });
    }
    
    // Postmortem status
    const postmortemStatusData = [];
    const postmortemCounts: Record<string, number> = {};
    
    filteredPostmortems.forEach(postmortem => {
      postmortemCounts[postmortem.status] = (postmortemCounts[postmortem.status] || 0) + 1;
    });
    
    for (const [status, count] of Object.entries(postmortemCounts)) {
      postmortemStatusData.push({
        name: status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        value: count
      });
    }
    
    return { statusData, wardData, releaseStatusData, postmortemStatusData };
  };
  
  // Generate report summary
  const getReportSummary = () => {
    const { filteredPatients, filteredReleases, filteredPostmortems } = getFilteredData();
    
    return {
      totalPatients: filteredPatients.length,
      totalReleases: filteredReleases.length,
      releasedBodies: filteredReleases.filter(r => r.approvalStatus === "approved").length,
      postmortems: filteredPostmortems.length,
      unclaimedBodies: filteredPatients.filter(p => p.status === "unclaimed").length,
      periodStart: format(new Date(startDate), "MMMM d, yyyy"),
      periodEnd: format(new Date(endDate), "MMMM d, yyyy"),
    };
  };
  
  // Handle report download
  const handleDownloadReport = () => {
    const summary = getReportSummary();
    const { filteredPatients, filteredReleases } = getFilteredData();
    
    // In a real implementation, this would generate a PDF or Excel report
    // For now, we'll just show a message
    alert(`Report would be downloaded for period: ${summary.periodStart} to ${summary.periodEnd}`);
  };
  
  const chartData = prepareChartData();
  const summary = getReportSummary();

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-medium text-primary">Reports & Analytics</h1>
        <Button onClick={handleDownloadReport} disabled={isLoading}>
          <FileText className="w-4 h-4 mr-2" />
          Generate Report
        </Button>
      </div>
      
      {/* Report period selector */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row md:items-end gap-4">
            <div className="space-y-2">
              <Label htmlFor="report-period">Report Period</Label>
              <Select value={reportPeriod} onValueChange={handlePeriodChange}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="last7">Last 7 days</SelectItem>
                  <SelectItem value="last30">Last 30 days</SelectItem>
                  <SelectItem value="last90">Last 90 days</SelectItem>
                  <SelectItem value="thisMonth">This month</SelectItem>
                  <SelectItem value="lastMonth">Last month</SelectItem>
                  <SelectItem value="custom">Custom range</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {reportPeriod === "custom" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="start-date">Start Date</Label>
                  <Input 
                    id="start-date" 
                    type="date" 
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end-date">End Date</Label>
                  <Input 
                    id="end-date" 
                    type="date" 
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </>
            )}
            
            <Button 
              variant="outline" 
              className="md:mb-0.5"
              onClick={() => {
                // Refresh data with current date range
                // In a real implementation, this might refetch data with new parameters
              }}
            >
              Apply
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Registrations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : summary.totalPatients}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Release Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : summary.totalReleases}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Bodies Released</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : summary.releasedBodies}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Postmortems</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : summary.postmortems}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Unclaimed Bodies</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : summary.unclaimedBodies}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="storage">Storage</TabsTrigger>
          <TabsTrigger value="releases">Releases</TabsTrigger>
          <TabsTrigger value="postmortems">Postmortems</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Patient Status Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  <span>Patient Status Breakdown</span>
                </CardTitle>
                <CardDescription>Distribution of deceased patients by status</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                {isLoading ? (
                  <div className="flex justify-center items-center h-full">
                    <Loader2 className="h-8 w-8 animate-spin text-accent" />
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={chartData.statusData}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {chartData.statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend layout="horizontal" verticalAlign="bottom" align="center" />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
            
            {/* Origin Ward */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  <span>Origin Ward</span>
                </CardTitle>
                <CardDescription>Patient registrations by originating ward</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                {isLoading ? (
                  <div className="flex justify-center items-center h-full">
                    <Loader2 className="h-8 w-8 animate-spin text-accent" />
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={chartData.wardData}
                      margin={{
                        top: 20,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" name="Patients" fill="hsl(var(--chart-1))" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Report Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Report Summary</CardTitle>
              <CardDescription>
                {`Period: ${summary.periodStart} to ${summary.periodEnd}`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none">
                <p>
                  This report covers all mortuary activities from {summary.periodStart} to {summary.periodEnd}.
                  During this period, the mortuary processed a total of <strong>{summary.totalPatients}</strong> deceased patients.
                </p>
                
                <h4>Key Metrics:</h4>
                <ul>
                  <li><strong>{summary.totalReleases}</strong> release requests were processed</li>
                  <li><strong>{summary.releasedBodies}</strong> bodies were released to next of kin or funeral homes</li>
                  <li><strong>{summary.postmortems}</strong> postmortem examinations were conducted</li>
                  <li><strong>{summary.unclaimedBodies}</strong> bodies remain unclaimed</li>
                </ul>
                
                <p>
                  The current morgue occupancy rate is <strong>{storageUnits ? Math.round((storageUnits.filter(u => u.status === "occupied").length / storageUnits.length) * 100) : 0}%</strong>,
                  with <strong>{storageUnits?.filter(u => u.status === "available").length || 0}</strong> units available for new assignments.
                </p>
              </div>
              
              <div className="flex justify-end mt-4">
                <Button variant="outline" onClick={handleDownloadReport}>
                  <Download className="h-4 w-4 mr-2" />
                  Download Detailed Report
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="storage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Storage Unit Occupancy</CardTitle>
              <CardDescription>Current status of all storage units</CardDescription>
            </CardHeader>
            <CardContent className="h-96">
              {isLoading ? (
                <div className="flex justify-center items-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin text-accent" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={[
                        { name: "Occupied", value: storageUnits?.filter(u => u.status === "occupied").length || 0 },
                        { name: "Available", value: storageUnits?.filter(u => u.status === "available").length || 0 },
                        { name: "Maintenance", value: storageUnits?.filter(u => u.status === "maintenance").length || 0 },
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      <Cell fill="hsl(var(--chart-1))" />
                      <Cell fill="hsl(var(--chart-2))" />
                      <Cell fill="hsl(var(--chart-3))" />
                    </Pie>
                    <Tooltip />
                    <Legend layout="horizontal" verticalAlign="bottom" align="center" />
                  </RechartsPieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Storage Usage by Section</CardTitle>
              <CardDescription>Breakdown of storage usage by facility section</CardDescription>
            </CardHeader>
            <CardContent className="h-96">
              {isLoading ? (
                <div className="flex justify-center items-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin text-accent" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={
                      Object.entries(
                        storageUnits?.reduce<Record<string, { occupied: number, available: number, maintenance: number }>>(
                          (acc, unit) => {
                            if (!acc[unit.section]) {
                              acc[unit.section] = { occupied: 0, available: 0, maintenance: 0 };
                            }
                            acc[unit.section][unit.status as "occupied" | "available" | "maintenance"] += 1;
                            return acc;
                          },
                          {}
                        ) || {}
                      ).map(([section, stats]) => ({
                        section,
                        occupied: stats.occupied,
                        available: stats.available,
                        maintenance: stats.maintenance,
                      }))
                    }
                    margin={{
                      top: 20,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="section" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="occupied" name="Occupied" stackId="a" fill="hsl(var(--chart-1))" />
                    <Bar dataKey="available" name="Available" stackId="a" fill="hsl(var(--chart-2))" />
                    <Bar dataKey="maintenance" name="Maintenance" stackId="a" fill="hsl(var(--chart-3))" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="releases" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Release Request Status</CardTitle>
              <CardDescription>Status of body release requests</CardDescription>
            </CardHeader>
            <CardContent className="h-96">
              {isLoading ? (
                <div className="flex justify-center items-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin text-accent" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={chartData.releaseStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      <Cell fill="hsl(var(--chart-2))" /> {/* Approved */}
                      <Cell fill="hsl(var(--chart-3))" /> {/* Pending */}
                      <Cell fill="hsl(var(--chart-5))" /> {/* Rejected */}
                    </Pie>
                    <Tooltip />
                    <Legend layout="horizontal" verticalAlign="bottom" align="center" />
                  </RechartsPieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Processing Time</CardTitle>
              <CardDescription>Average time to process release requests</CardDescription>
            </CardHeader>
            <CardContent className="h-96">
              {isLoading ? (
                <div className="flex justify-center items-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin text-accent" />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full">
                  <Clock className="h-20 w-20 text-accent mb-4" />
                  <h3 className="text-3xl font-bold mb-2">24 hours</h3>
                  <p className="text-gray-500 text-center max-w-md">
                    Average time between request submission and approval during the selected period.
                    This is based on {summary.releasedBodies} approved releases.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="postmortems" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Postmortem Status</CardTitle>
              <CardDescription>Status of postmortem examinations</CardDescription>
            </CardHeader>
            <CardContent className="h-96">
              {isLoading ? (
                <div className="flex justify-center items-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin text-accent" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={chartData.postmortemStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {chartData.postmortemStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend layout="horizontal" verticalAlign="bottom" align="center" />
                  </RechartsPieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Postmortem Types</CardTitle>
              <CardDescription>Distribution of forensic vs. standard postmortems</CardDescription>
            </CardHeader>
            <CardContent className="h-96">
              {isLoading ? (
                <div className="flex justify-center items-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin text-accent" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      {
                        name: "Forensic",
                        count: postmortems?.filter(p => p.isForensic).length || 0,
                      },
                      {
                        name: "Standard",
                        count: postmortems?.filter(p => !p.isForensic).length || 0,
                      }
                    ]}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" name="Postmortems" fill="hsl(var(--chart-1))" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
}

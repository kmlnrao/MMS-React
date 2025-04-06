import { useState } from "react";
import AppLayout from "@/components/layout/app-layout";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable } from "@/components/ui/data-table";
import { 
  BodyReleaseRequest, 
  DeceasedPatient 
} from "@shared/schema";
import { 
  Loader2, 
  Plus, 
  CheckCircle, 
  XCircle,
  User,
  Calendar, 
  FileText,
  Clock
} from "lucide-react";
import { format } from "date-fns";
import StatusBadge from "@/components/ui/status-badge";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ColumnDef } from "@tanstack/react-table";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import ReleaseApproval from "@/components/release/release-approval";
import { useAuth } from "@/hooks/use-auth";

export default function BodyRelease() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [showNewRequestDialog, setShowNewRequestDialog] = useState(false);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [selectedRelease, setSelectedRelease] = useState<BodyReleaseRequest | null>(null);
  
  // Load data
  const { data: releases, isLoading: isLoadingReleases } = useQuery<BodyReleaseRequest[]>({
    queryKey: ["/api/releases"],
  });
  
  const { data: patients, isLoading: isLoadingPatients } = useQuery<DeceasedPatient[]>({
    queryKey: ["/api/patients"],
  });
  
  // New release request form schema
  const formSchema = z.object({
    deceasedId: z.number({
      required_error: "Please select a patient",
    }),
    nextOfKinName: z.string().min(3, "Name must be at least 3 characters"),
    nextOfKinRelation: z.string().min(2, "Relation must be at least 2 characters"),
    nextOfKinContact: z.string().min(6, "Contact must be at least 6 characters"),
    identityVerified: z.boolean().default(false),
    notes: z.string().optional(),
  });
  
  // Create form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nextOfKinName: "",
      nextOfKinRelation: "",
      nextOfKinContact: "",
      identityVerified: false,
      notes: "",
    },
  });
  
  // Create release request mutation
  const createReleaseMutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      const res = await apiRequest("POST", "/api/releases", values);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Release request created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/releases"] });
      queryClient.invalidateQueries({ queryKey: ["/api/patients"] });
      setShowNewRequestDialog(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create release request: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = (values: z.infer<typeof formSchema>) => {
    createReleaseMutation.mutate(values);
  };
  
  const handleApproveRelease = (release: BodyReleaseRequest) => {
    setSelectedRelease(release);
    setShowApprovalDialog(true);
  };
  
  // Get available patients for release (those not already released or with pending release)
  const availablePatients = patients?.filter(patient => 
    patient.status !== "released" && 
    patient.status !== "pending_release" &&
    !releases?.some(r => 
      r.deceasedId === patient.id && 
      (r.approvalStatus === "pending" || r.approvalStatus === "approved")
    )
  );
  
  // Column definitions for release requests
  const releaseColumns: ColumnDef<BodyReleaseRequest & { patient?: DeceasedPatient }>[] = [
    {
      accessorKey: "deceasedId",
      header: "Patient",
      cell: ({ row }) => {
        const patient = row.original.patient;
        return patient ? (
          <div>
            <div className="font-medium">{patient.fullName}</div>
            <div className="text-xs text-gray-500">{patient.mrNumber}</div>
          </div>
        ) : `ID: ${row.original.deceasedId}`;
      },
    },
    {
      accessorKey: "nextOfKinName",
      header: "Next of Kin",
      cell: ({ row }) => (
        <div>
          <div>{row.getValue("nextOfKinName")}</div>
          <div className="text-xs text-gray-500">{row.original.nextOfKinRelation}</div>
        </div>
      ),
    },
    {
      accessorKey: "requestDate",
      header: "Request Date",
      cell: ({ row }) => format(new Date(row.getValue("requestDate")), "MMM d, yyyy"),
    },
    {
      accessorKey: "approvalStatus",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("approvalStatus") as string;
        return (
          <div className="flex items-center">
            {status === "approved" ? (
              <span className="px-2 py-1 text-xs rounded-full bg-success bg-opacity-10 text-success">
                Approved
              </span>
            ) : status === "rejected" ? (
              <span className="px-2 py-1 text-xs rounded-full bg-error bg-opacity-10 text-error">
                Rejected
              </span>
            ) : (
              <span className="px-2 py-1 text-xs rounded-full bg-warning bg-opacity-10 text-warning">
                Pending
              </span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "identityVerified",
      header: "Identity Verified",
      cell: ({ row }) => (
        <div>
          {row.getValue("identityVerified") ? (
            <CheckCircle className="h-5 w-5 text-success" />
          ) : (
            <XCircle className="h-5 w-5 text-error" />
          )}
        </div>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const release = row.original;
        
        if (release.approvalStatus === "pending" && 
            (user?.role === "admin" || user?.role === "medical_staff")) {
          return (
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-accent"
              onClick={() => handleApproveRelease(release)}
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Approve
            </Button>
          );
        } else if (release.approvalStatus === "approved") {
          return (
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-gray-500"
              onClick={() => {
                toast({
                  title: "Already Processed",
                  description: `This request was approved on ${format(new Date(release.approvalDate!), "MMM d, yyyy")}`,
                });
              }}
            >
              <FileText className="h-4 w-4 mr-1" />
              Details
            </Button>
          );
        } else {
          return (
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-gray-500"
              onClick={() => {
                toast({
                  title: "Request Status",
                  description: "This request is pending or has been rejected",
                });
              }}
            >
              <FileText className="h-4 w-4 mr-1" />
              Details
            </Button>
          );
        }
      },
    },
  ];
  
  // Prepare release data with patient information
  const releasesWithDetails = releases?.map(release => {
    const patient = patients?.find(p => p.id === release.deceasedId);
    return { ...release, patient };
  }) || [];

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-medium text-primary">Body Release Management</h1>
        <Button onClick={() => setShowNewRequestDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Release Request
        </Button>
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All Requests</TabsTrigger>
          <TabsTrigger value="pending">Pending Approval</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Release Requests</CardTitle>
              <CardDescription>View and manage all body release requests</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingReleases || isLoadingPatients ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-accent" />
                </div>
              ) : (
                <DataTable 
                  columns={releaseColumns} 
                  data={releasesWithDetails} 
                  searchPlaceholder="Search by patient name..."
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="pending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending Approval</CardTitle>
              <CardDescription>Requests awaiting approval</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingReleases || isLoadingPatients ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-accent" />
                </div>
              ) : (
                <DataTable 
                  columns={releaseColumns} 
                  data={releasesWithDetails.filter(r => r.approvalStatus === "pending")} 
                  searchPlaceholder="Search by patient name..."
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="approved" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Approved Requests</CardTitle>
              <CardDescription>Successfully approved release requests</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingReleases || isLoadingPatients ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-accent" />
                </div>
              ) : (
                <DataTable 
                  columns={releaseColumns} 
                  data={releasesWithDetails.filter(r => r.approvalStatus === "approved")} 
                  searchPlaceholder="Search by patient name..."
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="rejected" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Rejected Requests</CardTitle>
              <CardDescription>Release requests that were denied</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingReleases || isLoadingPatients ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-accent" />
                </div>
              ) : (
                <DataTable 
                  columns={releaseColumns} 
                  data={releasesWithDetails.filter(r => r.approvalStatus === "rejected")} 
                  searchPlaceholder="Search by patient name..."
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* New Release Request Dialog */}
      <Dialog open={showNewRequestDialog} onOpenChange={setShowNewRequestDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>New Release Request</DialogTitle>
            <DialogDescription>Create a new body release request</DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="deceasedId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Patient</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      defaultValue={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select patient" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availablePatients && availablePatients.length > 0 ? (
                          availablePatients.map(patient => (
                            <SelectItem key={patient.id} value={patient.id.toString()}>
                              {patient.fullName} ({patient.mrNumber})
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="" disabled>No available patients</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="nextOfKinName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Next of Kin Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Full name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="nextOfKinRelation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Relation to Deceased</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Spouse, Child, Sibling" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="nextOfKinContact"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Information</FormLabel>
                    <FormControl>
                      <Input placeholder="Phone number or email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="identityVerified"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        I have verified the identity of the next of kin
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Additional notes or instructions"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowNewRequestDialog(false);
                    form.reset();
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createReleaseMutation.isPending}
                >
                  {createReleaseMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Submit Request
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Approval Dialog */}
      {selectedRelease && (
        <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
          <DialogContent className="max-w-3xl">
            <ReleaseApproval
              release={selectedRelease}
              patient={patients?.find(p => p.id === selectedRelease.deceasedId)!}
              onComplete={() => setShowApprovalDialog(false)}
            />
          </DialogContent>
        </Dialog>
      )}
      
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="space-y-1">
              <CardTitle className="text-sm font-medium">Pending Releases</CardTitle>
              <CardDescription>Awaiting approval</CardDescription>
            </div>
            <Clock className="w-5 h-5 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoadingReleases ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                releases?.filter(r => r.approvalStatus === "pending").length || 0
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="space-y-1">
              <CardTitle className="text-sm font-medium">Completed Releases</CardTitle>
              <CardDescription>This month</CardDescription>
            </div>
            <CheckCircle className="w-5 h-5 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoadingReleases ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                releases?.filter(r => {
                  const releaseDate = r.releaseDate ? new Date(r.releaseDate) : null;
                  const now = new Date();
                  return r.approvalStatus === "approved" && 
                         releaseDate && 
                         releaseDate.getMonth() === now.getMonth() &&
                         releaseDate.getFullYear() === now.getFullYear();
                }).length || 0
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="space-y-1">
              <CardTitle className="text-sm font-medium">Average Processing Time</CardTitle>
              <CardDescription>Request to approval</CardDescription>
            </div>
            <Calendar className="w-5 h-5 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoadingReleases ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                releases?.some(r => r.approvalStatus === "approved" && r.approvalDate) ? "24 hours" : "N/A"
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

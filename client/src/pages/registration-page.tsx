import AppLayout from "@/components/layout/app-layout";
import RegistrationForm from "@/components/registration/registration-form";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { 
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import React, { useState } from "react";
import { DeceasedPatient } from "@shared/schema";
import { format } from "date-fns";
import StatusBadge from "@/components/ui/status-badge";
import { 
  Download, 
  FileSearch, 
  Filter, 
  Loader2, 
  MoreHorizontal, 
  PlusCircle,
  Search,
  Edit,
  Clipboard,
  ExternalLink,
  Printer
} from "lucide-react"
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  Dialog, 
  DialogContent, 
  DialogTrigger, 
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";

export default function RegistrationPage() {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [showNewForm, setShowNewForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
  const [showPostmortemForm, setShowPostmortemForm] = useState(false);
  const [showReleaseForm, setShowReleaseForm] = useState(false);
  const { toast } = useToast();
  
  const { data: patients, isLoading } = useQuery<DeceasedPatient[]>({
    queryKey: ["/api/patients"],
  });

  // Handle edit patient
  const handleEditPatient = (patientId: number) => {
    setSelectedPatientId(patientId);
    setShowEditForm(true);
  };

  // Handle schedule postmortem
  const handleSchedulePostmortem = async (patientId: number) => {
    try {
      // First update patient status to pending_autopsy
      await apiRequest("PATCH", `/api/patients/${patientId}`, {
        status: "pending_autopsy"
      });
      
      // Then open postmortem form
      setSelectedPatientId(patientId);
      setShowPostmortemForm(true);
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ["/api/patients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      
      toast({
        title: "Success",
        description: "Patient status updated to pending autopsy",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to update patient status: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  // Handle request release
  const handleRequestRelease = async (patientId: number) => {
    try {
      // First update patient status to pending_release
      await apiRequest("PATCH", `/api/patients/${patientId}`, {
        status: "pending_release"
      });
      
      // Then open release form
      setSelectedPatientId(patientId);
      setShowReleaseForm(true);
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ["/api/patients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      
      toast({
        title: "Success", 
        description: "Patient status updated to pending release",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to update patient status: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  // Handle print details
  const handlePrintDetails = (patient: DeceasedPatient) => {
    // Create a printable window with patient details
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Patient Details: ${patient.fullName}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              h1 { color: #1976d2; }
              .grid { display: grid; grid-template-columns: 150px auto; gap: 8px; margin-bottom: 15px; }
              .label { font-weight: bold; color: #666; }
              .header { border-bottom: 1px solid #eee; padding-bottom: 10px; margin-bottom: 20px; }
              .notes { margin-top: 20px; border-top: 1px solid #eee; padding-top: 15px; }
              @media print {
                body { margin: 0; padding: 15px; }
                button { display: none; }
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Patient Record</h1>
              <p>Mortuary Management System</p>
            </div>
            
            <div class="grid">
              <div class="label">Patient ID:</div>
              <div>${patient.mrNumber}</div>
              
              <div class="label">Name:</div>
              <div>${patient.fullName}</div>
              
              <div class="label">Age/Gender:</div>
              <div>${patient.age}y, ${patient.gender === 'male' ? 'Male' : patient.gender === 'female' ? 'Female' : 'Other'}</div>
              
              <div class="label">Date of Death:</div>
              <div>${format(new Date(patient.dateOfDeath), "MMMM d, yyyy 'at' h:mm a")}</div>
              
              <div class="label">Cause of Death:</div>
              <div>${patient.causeOfDeath}</div>
              
              <div class="label">From Ward:</div>
              <div>${patient.wardFrom}</div>
              
              <div class="label">Attending Physician:</div>
              <div>${patient.attendingPhysician}</div>
              
              <div class="label">Status:</div>
              <div>${patient.status.replace('_', ' ')}</div>
            </div>
            
            <div class="notes">
              <h3>Notes</h3>
              <p>${patient.notes || "No notes available for this patient."}</p>
            </div>
            
            <button onclick="window.print()" style="margin-top: 20px; padding: 8px 16px; background: #1976d2; color: white; border: none; border-radius: 4px; cursor: pointer;">
              Print Document
            </button>
          </body>
        </html>
      `);
      printWindow.document.close();
    } else {
      toast({
        title: "Error",
        description: "Could not open print window. Please check your browser settings.",
        variant: "destructive",
      });
    }
  };
  
  const columns: ColumnDef<DeceasedPatient>[] = [
    {
      accessorKey: "mrNumber",
      header: "ID",
      cell: ({ row }) => <span className="font-mono text-sm">{row.getValue("mrNumber")}</span>,
    },
    {
      accessorKey: "fullName",
      header: "Patient Name",
      cell: ({ row }) => {
        return (
          <div>
            <div className="font-medium">{row.getValue("fullName")}</div>
            <div className="text-xs text-gray-500">
              {row.original.age}y, {row.original.gender === 'male' ? 'Male' : row.original.gender === 'female' ? 'Female' : 'Other'}
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "dateOfDeath",
      header: "Date of Death",
      cell: ({ row }) => {
        const date = new Date(row.getValue("dateOfDeath"));
        return (
          <div>
            <div className="text-sm">{format(date, "MMM d, yyyy")}</div>
            <div className="text-xs text-gray-500">{format(date, "h:mm a")}</div>
          </div>
        )
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.getValue("status")} />,
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const patient = row.original
 
        return (
          <div className="flex space-x-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-accent hover:text-accent-light">
                  <FileSearch className="h-5 w-5" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl">
                <DialogTitle>Patient Details</DialogTitle>
                <DialogDescription>Detailed information about the patient</DialogDescription>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-medium text-lg mb-4">Patient Information</h3>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="text-gray-500">ID:</div>
                        <div className="font-mono">{patient.mrNumber}</div>
                        <div className="text-gray-500">Name:</div>
                        <div>{patient.fullName}</div>
                        <div className="text-gray-500">Age/Gender:</div>
                        <div>{patient.age}y, {patient.gender === 'male' ? 'Male' : patient.gender === 'female' ? 'Female' : 'Other'}</div>
                        <div className="text-gray-500">Date of Death:</div>
                        <div>{format(new Date(patient.dateOfDeath), "MMM d, yyyy 'at' h:mm a")}</div>
                        <div className="text-gray-500">Cause:</div>
                        <div>{patient.causeOfDeath}</div>
                        <div className="text-gray-500">From Ward:</div>
                        <div>{patient.wardFrom}</div>
                        <div className="text-gray-500">Physician:</div>
                        <div>{patient.attendingPhysician}</div>
                        <div className="text-gray-500">Status:</div>
                        <div><StatusBadge status={patient.status} /></div>
                      </div>
                    </div>
                    <div className="border-l pl-4">
                      <h3 className="font-medium text-lg mb-4">Notes</h3>
                      <p className="text-sm text-gray-700">
                        {patient.notes || "No notes available for this patient."}
                      </p>
                      <h3 className="font-medium text-lg mt-6 mb-4">Documents</h3>
                      {patient.documents && patient.documents.length > 0 ? (
                        <ul className="space-y-1">
                          {patient.documents.map((doc, i) => (
                            <li key={i} className="text-sm text-accent hover:underline cursor-pointer flex items-center">
                              <Download className="h-3 w-3 mr-1" />
                              {doc}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-gray-500">No documents attached.</p>
                      )}
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => handleEditPatient(patient.id)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Information
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => handleSchedulePostmortem(patient.id)}
                  disabled={patient.status === 'pending_autopsy' || patient.status === 'autopsy_completed'}>
                  <Clipboard className="h-4 w-4 mr-2" />
                  Schedule Postmortem
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => handleRequestRelease(patient.id)}
                  disabled={patient.status === 'pending_release' || patient.status === 'released'}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Request Release
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handlePrintDetails(patient)}>
                  <Printer className="h-4 w-4 mr-2" />
                  Print Details
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )
      },
    },
  ];

  const table = useReactTable({
    data: patients || [],
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
    },
  });

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-medium text-primary">Deceased Patient Registration</h1>
        {/* New Registration Dialog */}
        <Dialog open={showNewForm} onOpenChange={setShowNewForm}>
          <DialogTrigger asChild>
            <Button className="bg-accent hover:bg-accent-light text-white">
              <PlusCircle className="w-5 h-5 mr-2" />
              New Registration
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl">
            <DialogTitle>New Patient Registration</DialogTitle>
            <DialogDescription>Fill in the details to register a deceased patient</DialogDescription>
            <RegistrationForm onComplete={() => setShowNewForm(false)} />
          </DialogContent>
        </Dialog>
        
        {/* Edit Patient Dialog */}
        <Dialog open={showEditForm} onOpenChange={setShowEditForm}>
          <DialogContent className="max-w-3xl">
            <DialogTitle>Edit Patient Information</DialogTitle>
            <DialogDescription>Update the deceased patient's details</DialogDescription>
            <RegistrationForm 
              patientId={selectedPatientId!} 
              onComplete={() => {
                setShowEditForm(false);
                setSelectedPatientId(null);
              }} 
            />
          </DialogContent>
        </Dialog>
        
        {/* Postmortem Dialog */}
        <Dialog open={showPostmortemForm} onOpenChange={setShowPostmortemForm}>
          <DialogContent className="max-w-3xl">
            <DialogTitle>Schedule Postmortem</DialogTitle>
            <DialogDescription>The patient will be scheduled for a postmortem procedure</DialogDescription>
            <div className="py-6">
              
              <p className="text-gray-700 mb-6">
                The selected patient has been marked for postmortem. You will be redirected to the Postmortem page where you can assign a doctor and schedule the procedure.
              </p>
              <div className="flex justify-end space-x-4">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowPostmortemForm(false);
                    setSelectedPatientId(null);
                  }}
                >
                  Close
                </Button>
                <Button 
                  onClick={() => {
                    // Navigate to postmortem page (in a real app, use router here)
                    window.location.href = "/postmortem";
                  }}
                >
                  Go to Postmortem Management
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        
        {/* Body Release Dialog */}
        <Dialog open={showReleaseForm} onOpenChange={setShowReleaseForm}>
          <DialogContent className="max-w-3xl">
            <DialogTitle>Request Body Release</DialogTitle>
            <DialogDescription>Initiate the process to release the deceased to family members</DialogDescription>
            <div className="py-6">
              <p className="text-gray-700 mb-6">
                The selected patient has been marked for release. You will be redirected to the Body Release page where you can complete the release process.
              </p>
              <div className="flex justify-end space-x-4">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowReleaseForm(false);
                    setSelectedPatientId(null);
                  }}
                >
                  Close
                </Button>
                <Button 
                  onClick={() => {
                    // Navigate to body release page (in a real app, use router here)
                    window.location.href = "/body-release";
                  }}
                >
                  Go to Body Release Management
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="all">
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="all">All Patients</TabsTrigger>
            <TabsTrigger value="recent">Recent</TabsTrigger>
            <TabsTrigger value="pending">Pending Actions</TabsTrigger>
            <TabsTrigger value="unclaimed">Unclaimed</TabsTrigger>
          </TabsList>
          <div className="flex items-center space-x-2">
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search patients..."
                value={(table.getColumn("fullName")?.getFilterValue() as string) ?? ""}
                onChange={(event) =>
                  table.getColumn("fullName")?.setFilterValue(event.target.value)
                }
                className="pl-8"
              />
            </div>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <TabsContent value="all" className="mt-0">
          <div className="rounded-md border">
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-accent" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => {
                        return (
                          <TableHead key={header.id}>
                            {header.isPlaceholder
                              ? null
                              : flexRender(
                                  header.column.columnDef.header,
                                  header.getContext()
                                )}
                          </TableHead>
                        )
                      })}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows?.length ? (
                    table.getRowModel().rows.map((row) => (
                      <TableRow
                        key={row.id}
                        data-state={row.getIsSelected() && "selected"}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id}>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={columns.length} className="h-24 text-center">
                        No patients found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </div>
          <div className="flex items-center justify-end space-x-2 py-4">
            <div className="text-sm text-gray-500">
              Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}-
              {Math.min(
                (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                table.getFilteredRowModel().rows.length
              )} of {table.getFilteredRowModel().rows.length}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
            </Button>
          </div>
        </TabsContent>
        
        <TabsContent value="recent" className="mt-0">
          <div className="rounded-md border bg-white p-8 text-center">
            <h3 className="text-lg font-medium text-gray-600">Showing recent registrations from the past 24 hours</h3>
            <p className="text-gray-500 mt-2">Filter functionality to be implemented</p>
          </div>
        </TabsContent>
        
        <TabsContent value="pending" className="mt-0">
          <div className="rounded-md border bg-white p-8 text-center">
            <h3 className="text-lg font-medium text-gray-600">Patients requiring attention or action</h3>
            <p className="text-gray-500 mt-2">Filter functionality to be implemented</p>
          </div>
        </TabsContent>
        
        <TabsContent value="unclaimed" className="mt-0">
          <div className="rounded-md border bg-white p-8 text-center">
            <h3 className="text-lg font-medium text-gray-600">Showing unclaimed bodies</h3>
            <p className="text-gray-500 mt-2">Filter functionality to be implemented</p>
          </div>
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
}

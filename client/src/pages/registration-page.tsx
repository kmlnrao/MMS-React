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
import { useState } from "react";
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
  Search 
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

export default function RegistrationPage() {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [showNewForm, setShowNewForm] = useState(false);
  
  const { data: patients, isLoading } = useQuery<DeceasedPatient[]>({
    queryKey: ["/api/patients"],
  });
  
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
                <DropdownMenuItem>Edit Information</DropdownMenuItem>
                <DropdownMenuItem>Schedule Postmortem</DropdownMenuItem>
                <DropdownMenuItem>Request Release</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Print Details</DropdownMenuItem>
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
        <Dialog open={showNewForm} onOpenChange={setShowNewForm}>
          <DialogTrigger asChild>
            <Button className="bg-accent hover:bg-accent-light text-white">
              <PlusCircle className="w-5 h-5 mr-2" />
              New Registration
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl">
            <RegistrationForm onComplete={() => setShowNewForm(false)} />
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

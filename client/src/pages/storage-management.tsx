import { useState } from "react";
import AppLayout from "@/components/layout/app-layout";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable } from "@/components/ui/data-table";
import { StorageUnit, StorageAssignment, DeceasedPatient } from "@shared/schema";
import { Loader2, PlusCircle, RefreshCw, Thermometer, Edit, Info } from "lucide-react";
import { format } from "date-fns";
import StatusBadge from "@/components/ui/status-badge";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger, 
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ColumnDef } from "@tanstack/react-table";

export default function StorageManagement() {
  const { toast } = useToast();
  const [showNewUnitDialog, setShowNewUnitDialog] = useState(false);
  const [showEditUnitDialog, setShowEditUnitDialog] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<StorageUnit | null>(null);
  const [unitNumber, setUnitNumber] = useState("");
  const [section, setSection] = useState("");
  const [temperature, setTemperature] = useState<number>(4);
  const [status, setStatus] = useState<string>("available");
  const [notes, setNotes] = useState("");
  
  // Load data
  const { data: storageUnits, isLoading: isLoadingUnits } = useQuery<StorageUnit[]>({
    queryKey: ["/api/storage-units"],
  });
  
  const { data: storageAssignments, isLoading: isLoadingAssignments } = useQuery<StorageAssignment[]>({
    queryKey: ["/api/storage-assignments"],
  });
  
  const { data: patients, isLoading: isLoadingPatients } = useQuery<DeceasedPatient[]>({
    queryKey: ["/api/patients"],
  });
  
  // Create storage unit
  const createUnitMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/storage-units", {
        unitNumber,
        section,
        temperature,
        status,
        notes
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Storage unit created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/storage-units"] });
      setShowNewUnitDialog(false);
      resetForm();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create storage unit: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Update storage unit
  const updateUnitMutation = useMutation({
    mutationFn: async () => {
      if (!selectedUnit) return;
      
      const res = await apiRequest("PATCH", `/api/storage-units/${selectedUnit.id}`, {
        temperature,
        status,
        notes
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Storage unit updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/storage-units"] });
      setShowEditUnitDialog(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update storage unit: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  const resetForm = () => {
    setUnitNumber("");
    setSection("");
    setTemperature(4);
    setStatus("available");
    setNotes("");
  };
  
  const handleEditUnit = (unit: StorageUnit) => {
    setSelectedUnit(unit);
    setTemperature(unit.temperature || 4);
    setStatus(unit.status);
    setNotes(unit.notes || "");
    setShowEditUnitDialog(true);
  };
  
  // Column definitions for storage units
  const unitsColumns: ColumnDef<StorageUnit>[] = [
    {
      accessorKey: "unitNumber",
      header: "Unit Number",
    },
    {
      accessorKey: "section",
      header: "Section",
    },
    {
      accessorKey: "temperature",
      header: "Temperature (°C)",
      cell: ({ row }) => {
        const temp = row.getValue("temperature");
        return temp ? `${temp}°C` : "N/A";
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        return <StatusBadge status={status} />;
      },
    },
    {
      accessorKey: "lastMaintenance",
      header: "Last Maintenance",
      cell: ({ row }) => {
        const date = row.getValue("lastMaintenance");
        return date ? format(new Date(date as string), "MMM d, yyyy") : "N/A";
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const unit = row.original;
        return (
          <div className="flex space-x-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-accent"
              onClick={() => handleEditUnit(unit)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => {
                // Update temperature
                handleEditUnit(unit);
              }}
            >
              <Thermometer className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  // Column definitions for assignments
  const assignmentsColumns: ColumnDef<StorageAssignment & { patient?: DeceasedPatient, unit?: StorageUnit }>[] = [
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
      accessorKey: "storageUnitId",
      header: "Storage Unit",
      cell: ({ row }) => {
        const unit = row.original.unit;
        return unit ? unit.unitNumber : `ID: ${row.original.storageUnitId}`;
      },
    },
    {
      accessorKey: "assignedAt",
      header: "Assigned Date",
      cell: ({ row }) => format(new Date(row.original.assignedAt), "MMM d, yyyy"),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: "releaseDate",
      header: "Release Date",
      cell: ({ row }) => {
        const date = row.original.releaseDate;
        return date ? format(new Date(date), "MMM d, yyyy") : "N/A";
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        return (
          <Button variant="ghost" size="icon" className="text-accent">
            <Info className="h-4 w-4" />
          </Button>
        );
      },
    },
  ];
  
  // Prepare assignments data with patient and unit information
  const assignmentsWithDetails = storageAssignments?.map(assignment => {
    const patient = patients?.find(p => p.id === assignment.deceasedId);
    const unit = storageUnits?.find(u => u.id === assignment.storageUnitId);
    return { ...assignment, patient, unit };
  }) || [];

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-medium text-primary">Storage Management</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/storage-units"] })}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setShowNewUnitDialog(true)}>
            <PlusCircle className="w-4 h-4 mr-2" />
            Add Storage Unit
          </Button>
        </div>
      </div>

      <Tabs defaultValue="units">
        <TabsList>
          <TabsTrigger value="units">Storage Units</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
        </TabsList>
        
        <TabsContent value="units" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Storage Units</CardTitle>
              <CardDescription>Manage storage units and temperature monitoring</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingUnits ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-accent" />
                </div>
              ) : (
                <DataTable 
                  columns={unitsColumns} 
                  data={storageUnits || []} 
                  searchColumn="unitNumber"
                  searchPlaceholder="Search by unit number..."
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="assignments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Storage Assignments</CardTitle>
              <CardDescription>Current and past storage assignments</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingAssignments || isLoadingPatients ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-accent" />
                </div>
              ) : (
                <DataTable 
                  columns={assignmentsColumns} 
                  data={assignmentsWithDetails} 
                  searchPlaceholder="Search assignments..."
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* New Storage Unit Dialog */}
      <Dialog open={showNewUnitDialog} onOpenChange={setShowNewUnitDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Storage Unit</DialogTitle>
            <DialogDescription>Create a new storage unit in the mortuary.</DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="unitNumber">Unit Number</Label>
                <Input
                  id="unitNumber"
                  value={unitNumber}
                  onChange={(e) => setUnitNumber(e.target.value)}
                  placeholder="e.g., A-01, B-05"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="section">Section</Label>
                <Input
                  id="section"
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                  placeholder="e.g., A, B, C"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="temperature">Temperature (°C)</Label>
                <Input
                  id="temperature"
                  type="number"
                  value={temperature}
                  onChange={(e) => setTemperature(Number(e.target.value))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="occupied">Occupied</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Input
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional notes (optional)"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowNewUnitDialog(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => createUnitMutation.mutate()}
              disabled={!unitNumber || !section || createUnitMutation.isPending}
            >
              {createUnitMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Unit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit Storage Unit Dialog */}
      <Dialog open={showEditUnitDialog} onOpenChange={setShowEditUnitDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Storage Unit</DialogTitle>
            <DialogDescription>
              {selectedUnit && `Update storage unit ${selectedUnit.unitNumber}`}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-unitNumber">Unit Number</Label>
                <Input
                  id="edit-unitNumber"
                  value={selectedUnit?.unitNumber || ""}
                  disabled
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-section">Section</Label>
                <Input
                  id="edit-section"
                  value={selectedUnit?.section || ""}
                  disabled
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-temperature">Temperature (°C)</Label>
                <Input
                  id="edit-temperature"
                  type="number"
                  value={temperature}
                  onChange={(e) => setTemperature(Number(e.target.value))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-status">Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="occupied">Occupied</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-notes">Notes</Label>
              <Input
                id="edit-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional notes (optional)"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowEditUnitDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => updateUnitMutation.mutate()}
              disabled={updateUnitMutation.isPending}
            >
              {updateUnitMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Unit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}

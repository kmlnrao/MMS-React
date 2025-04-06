import { DeceasedPatient } from "@shared/schema";
import { Link } from "wouter";
import { format } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import StatusBadge from "@/components/ui/status-badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Eye, ChevronRight, Edit } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState } from "react";

interface RecentRegistrationsProps {
  patients: DeceasedPatient[];
}

export default function RecentRegistrations({ patients }: RecentRegistrationsProps) {
  const [selectedPatient, setSelectedPatient] = useState<DeceasedPatient | null>(null);

  return (
    <Card>
      <CardHeader className="px-6 py-4 border-b border-neutral-medium flex justify-between items-center">
        <div>
          <CardTitle>Recent Registrations</CardTitle>
          <CardDescription>Latest deceased patient records</CardDescription>
        </div>
        <Link href="/registration">
          <Button variant="link" className="text-accent text-sm hover:underline flex items-center">
            View All
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-neutral-light">
                <TableHead className="text-xs font-medium text-gray-500 uppercase tracking-wider">ID</TableHead>
                <TableHead className="text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</TableHead>
                <TableHead className="text-xs font-medium text-gray-500 uppercase tracking-wider">Received</TableHead>
                <TableHead className="text-xs font-medium text-gray-500 uppercase tracking-wider">Status</TableHead>
                <TableHead className="text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-neutral-medium">
              {patients && patients.length > 0 ? (
                patients.map(patient => (
                  <TableRow key={patient.id} className="hover:bg-neutral-light">
                    <TableCell className="px-6 py-4 whitespace-nowrap font-mono text-sm">
                      {patient.mrNumber}
                    </TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium">{patient.fullName}</div>
                          <div className="text-xs text-gray-500">
                            {patient.age}y, {patient.gender === 'male' ? 'Male' : patient.gender === 'female' ? 'Female' : 'Other'}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">{format(new Date(patient.registrationDate), "MMM d, yyyy")}</div>
                      <div className="text-xs text-gray-500">{format(new Date(patient.registrationDate), "h:mm a")}</div>
                    </TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={patient.status} />
                    </TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex space-x-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-accent hover:text-accent-light"
                          onClick={() => setSelectedPatient(patient)}
                        >
                          <Eye className="w-5 h-5" />
                        </Button>
                        <Link href={`/registration?edit=${patient.id}`}>
                          <Button variant="ghost" size="icon" className="text-gray-500 hover:text-gray-700">
                            <Edit className="w-5 h-5" />
                          </Button>
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                    No recent registrations found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div className="px-6 py-4 border-t border-neutral-medium flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Showing {patients ? patients.length : 0} of {patients ? patients.length : 0} entries
          </div>
        </div>
      </CardContent>

      {/* Patient details dialog */}
      <Dialog open={!!selectedPatient} onOpenChange={(open) => !open && setSelectedPatient(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Patient Details</DialogTitle>
          </DialogHeader>
          {selectedPatient && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium text-lg mb-4">Patient Information</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-gray-500">ID:</div>
                  <div className="font-mono">{selectedPatient.mrNumber}</div>
                  <div className="text-gray-500">Name:</div>
                  <div>{selectedPatient.fullName}</div>
                  <div className="text-gray-500">Age/Gender:</div>
                  <div>{selectedPatient.age}y, {selectedPatient.gender === 'male' ? 'Male' : selectedPatient.gender === 'female' ? 'Female' : 'Other'}</div>
                  <div className="text-gray-500">Date of Death:</div>
                  <div>{format(new Date(selectedPatient.dateOfDeath), "MMM d, yyyy 'at' h:mm a")}</div>
                  <div className="text-gray-500">Cause:</div>
                  <div>{selectedPatient.causeOfDeath}</div>
                  <div className="text-gray-500">From Ward:</div>
                  <div>{selectedPatient.wardFrom}</div>
                  <div className="text-gray-500">Physician:</div>
                  <div>{selectedPatient.attendingPhysician}</div>
                  <div className="text-gray-500">Status:</div>
                  <div><StatusBadge status={selectedPatient.status} /></div>
                </div>
              </div>
              <div className="border-l pl-4">
                <h3 className="font-medium text-lg mb-4">Notes</h3>
                <p className="text-sm text-gray-700">
                  {selectedPatient.notes || "No notes available for this patient."}
                </p>
                <h3 className="font-medium text-lg mt-6 mb-4">Documents</h3>
                {selectedPatient.documents && selectedPatient.documents.length > 0 ? (
                  <ul className="space-y-1">
                    {selectedPatient.documents.map((doc, i) => (
                      <li key={i} className="text-sm text-accent hover:underline cursor-pointer flex items-center">
                        {doc}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">No documents attached.</p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}

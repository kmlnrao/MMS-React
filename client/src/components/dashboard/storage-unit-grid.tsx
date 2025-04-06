import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { StorageUnit } from "@shared/schema";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export default function StorageUnitGrid() {
  const [selectedSection, setSelectedSection] = useState<string>("all");
  
  const { data: storageUnits, isLoading } = useQuery<StorageUnit[]>({
    queryKey: ["/api/storage-units"],
  });

  const getFilteredUnits = () => {
    if (!storageUnits) return [];
    
    if (selectedSection === "all") {
      return storageUnits;
    }
    
    return storageUnits.filter(unit => unit.section === selectedSection);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-success text-white";
      case "occupied":
        return "bg-accent text-white";
      case "maintenance":
        return "bg-warning text-white";
      default:
        return "bg-error text-white";
    }
  };

  const filteredUnits = getFilteredUnits();
  const sections = storageUnits 
    ? [...new Set(storageUnits.map(unit => unit.section))].sort()
    : [];

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Morgue Occupancy</CardTitle>
            <CardDescription>Visual status of storage units</CardDescription>
          </div>
          <Select
            value={selectedSection}
            onValueChange={setSelectedSection}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select section" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Units</SelectItem>
              {sections.map(section => (
                <SelectItem key={section} value={section}>Section {section}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="grid grid-cols-10 gap-2">
            {Array.from({ length: 20 }).map((_, index) => (
              <Skeleton key={index} className="aspect-square rounded-md" />
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
              {filteredUnits.map(unit => (
                <div
                  key={unit.id}
                  className={cn(
                    "aspect-square text-center flex flex-col items-center justify-center rounded-md text-xs hover:opacity-80 cursor-pointer",
                    getStatusColor(unit.status)
                  )}
                  title={`${unit.unitNumber} - ${unit.status}`}
                >
                  <span className="font-mono">{unit.unitNumber}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap justify-center mt-6 text-sm gap-4">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-success rounded-sm mr-2"></div>
                <span>Available</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-accent rounded-sm mr-2"></div>
                <span>Occupied</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-warning rounded-sm mr-2"></div>
                <span>Maintenance</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-error rounded-sm mr-2"></div>
                <span>Issue</span>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

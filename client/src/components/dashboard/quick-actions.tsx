import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, FileText, Calendar, CheckSquare } from "lucide-react";
import { Link } from "wouter";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { useState } from "react";
import RegistrationForm from "@/components/registration/registration-form";

export default function QuickActions() {
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  
  return (
    <Card>
      <CardHeader className="px-6 py-4 border-b border-neutral-medium">
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="grid grid-cols-2 gap-4">
          <Dialog open={showRegistrationForm} onOpenChange={setShowRegistrationForm}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex flex-col items-center justify-center p-4 border border-neutral-medium rounded-lg hover:bg-neutral-light h-auto">
                <Plus className="w-6 h-6 text-accent mb-2" />
                <span className="text-xs text-center">New Registration</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <RegistrationForm onComplete={() => setShowRegistrationForm(false)} />
            </DialogContent>
          </Dialog>

          <Link href="/reports">
            <Button variant="outline" className="flex flex-col items-center justify-center p-4 border border-neutral-medium rounded-lg hover:bg-neutral-light h-auto w-full">
              <FileText className="w-6 h-6 text-accent mb-2" />
              <span className="text-xs text-center">Generate Report</span>
            </Button>
          </Link>

          <Link href="/postmortem">
            <Button variant="outline" className="flex flex-col items-center justify-center p-4 border border-neutral-medium rounded-lg hover:bg-neutral-light h-auto w-full">
              <Calendar className="w-6 h-6 text-accent mb-2" />
              <span className="text-xs text-center">Schedule Autopsy</span>
            </Button>
          </Link>

          <Link href="/release">
            <Button variant="outline" className="flex flex-col items-center justify-center p-4 border border-neutral-medium rounded-lg hover:bg-neutral-light h-auto w-full">
              <CheckSquare className="w-6 h-6 text-accent mb-2" />
              <span className="text-xs text-center">Approve Release</span>
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

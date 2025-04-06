import { cn } from "@/lib/utils";
import { 
  AlertTriangle, 
  BarChart3, 
  Clock, 
  FileText, 
  TrendingDown, 
  TrendingUp
} from "lucide-react";

interface StatCardProps {
  title: string;
  value: number;
  icon: "document" | "chart" | "clock" | "alert";
  change?: string;
  changeType?: "increase" | "decrease" | "neutral";
  color: string;
}

export default function StatCard({ 
  title, 
  value, 
  icon, 
  change, 
  changeType = "neutral",
  color 
}: StatCardProps) {
  const getIcon = () => {
    switch (icon) {
      case "document":
        return <FileText className="w-6 h-6" />;
      case "chart":
        return <BarChart3 className="w-6 h-6" />;
      case "clock":
        return <Clock className="w-6 h-6" />;
      case "alert":
        return <AlertTriangle className="w-6 h-6" />;
      default:
        return <FileText className="w-6 h-6" />;
    }
  };

  const getChangeIcon = () => {
    switch (changeType) {
      case "increase":
        return <TrendingUp className="w-3.5 h-3.5 mr-1.5" />;
      case "decrease":
        return <TrendingDown className="w-3.5 h-3.5 mr-1.5" />;
      default:
        return null;
    }
  };

  const getChangeColor = () => {
    switch (changeType) {
      case "increase":
        return "text-[#43a047]";
      case "decrease":
        return "text-[#e53935]";
      default:
        return "text-[#ff9800]";
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border overflow-hidden ${color}`}>
      <div className="px-5 py-4 flex items-center justify-between">
        <div>
          <p className="text-[13px] text-[#546e7a] font-medium mb-1">{title}</p>
          <h3 className="text-2xl font-semibold">{value}</h3>
          {change && (
            <p className={cn("text-xs flex items-center mt-1.5", getChangeColor())}>
              {getChangeIcon()}
              <span className="font-medium">{change}</span>
            </p>
          )}
        </div>
        <div className="flex-shrink-0">
          {getIcon()}
        </div>
      </div>
    </div>
  );
}

import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
}

export const StatCard = ({ icon: Icon, label, value }: StatCardProps) => (
  <div className="bg-card rounded-lg border p-6">
    <div className="flex items-center gap-3">
      <div className="bg-primary/10 p-3 rounded-full">
        <Icon className="h-6 w-6 text-primary" />
      </div>
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
    </div>
  </div>
);

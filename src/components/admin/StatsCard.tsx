import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  color: 'blue' | 'green' | 'orange' | 'purple' | 'red';
}

const colorMap = {
  blue: 'text-blue-600',
  green: 'text-green-600', 
  orange: 'text-orange-600',
  purple: 'text-purple-600',
  red: 'text-red-600'
};

export const StatsCard = ({ title, value, icon: Icon, trend, color }: StatsCardProps) => {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {trend && (
              <div className={`flex items-center text-xs ${trend.isPositive ? 'text-success' : 'text-destructive'}`}>
                <span>{trend.isPositive ? '↗' : '↘'} {trend.value}</span>
              </div>
            )}
          </div>
          <Icon className={`h-8 w-8 ${colorMap[color]}`} />
        </div>
      </CardContent>
    </Card>
  );
};
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Bell } from 'lucide-react';

interface WeeklyReminderSectionProps {
  settings?: any;
  onChange: (settings: any) => void;
}

export default function WeeklyReminderSection({ settings, onChange }: WeeklyReminderSectionProps) {
  return (
    <Card className="border-2 border-red-500 bg-red-50">
      <CardHeader className="pb-4">
        <div className="flex items-center space-x-2">
          <Bell className="w-5 h-5 text-red-600" />
          <CardTitle className="text-lg font-semibold text-red-900">
            🔔 TEST: Weekly Reminders Section is Working!
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-red-700">
          If you can see this red box, the WeeklyReminderSection component is rendering successfully.
        </p>
      </CardContent>
    </Card>
  );
}
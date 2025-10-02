import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Button } from './ui/button';
import { Bell, Clock, Calendar } from 'lucide-react';

// For now, let's make this simpler to debug
interface WeeklyReminderSectionProps {
  settings?: any;
  onChange: (settings: any) => void;
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' }
];

const TIME_SLOTS = [
  { value: 'morning', label: 'Morning (9:00 AM)', icon: '🌅' },
  { value: 'afternoon', label: 'Afternoon (6:00 PM)', icon: '🌆' }
];

export default function WeeklyReminderSection({ settings, onChange }: WeeklyReminderSectionProps) {
  const [enabled, setEnabled] = useState(false);
  const [dayOfWeek, setDayOfWeek] = useState(1); // Default to Monday
  const [timeSlot, setTimeSlot] = useState<'morning' | 'afternoon'>('morning');

  // Update parent when settings change
  useEffect(() => {
    if (enabled) {
      const newSettings = {
        enabled,
        dayOfWeek,
        timeSlot: { [timeSlot]: null } // Motoko variant type
      };
      onChange(newSettings);
    } else {
      onChange(undefined);
    }
  }, [enabled, dayOfWeek, timeSlot, onChange]);

  const handleEnableChange = (newEnabled: boolean) => {
    setEnabled(newEnabled);
  };

  return (
    <Card className="border-2 border-purple-200">
      <CardHeader className="pb-4">
        <div className="flex items-center space-x-2">
          <Bell className="w-5 h-5 text-purple-600" />
          <CardTitle className="text-lg font-semibold text-gray-900">
            Weekly Reminders
          </CardTitle>
        </div>
        <CardDescription>
          Get a friendly reminder to update your journal once a week
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Enable/Disable Toggle */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-purple-50">
          <Label htmlFor="enable-reminders" className="text-sm font-medium text-gray-700">
            Enable weekly reminders
          </Label>
          <Switch
            id="enable-reminders"
            checked={enabled}
            onCheckedChange={handleEnableChange}
          />
        </div>

        {enabled && (
          <>
            {/* Day of Week Selection */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-purple-600" />
                <Label className="text-sm font-medium text-gray-700">
                  Day of the week
                </Label>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {DAYS_OF_WEEK.map((day) => (
                  <Button
                    key={day.value}
                    variant={dayOfWeek === day.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setDayOfWeek(day.value)}
                    className={`text-xs ${
                      dayOfWeek === day.value
                        ? "bg-purple-600 hover:bg-purple-700"
                        : "border-purple-200 hover:bg-purple-50"
                    }`}
                  >
                    {day.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Time Slot Selection */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-purple-600" />
                <Label className="text-sm font-medium text-gray-700">
                  Time of day
                </Label>
              </div>
              <div className="space-y-2">
                {TIME_SLOTS.map((slot) => (
                  <Button
                    key={slot.value}
                    variant={timeSlot === slot.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTimeSlot(slot.value as 'morning' | 'afternoon')}
                    className={`w-full justify-start text-sm ${
                      timeSlot === slot.value
                        ? "bg-purple-600 hover:bg-purple-700"
                        : "border-purple-200 hover:bg-purple-50"
                    }`}
                  >
                    <span className="text-lg mr-2">{slot.icon}</span>
                    {slot.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Preview */}
            <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-xs text-gray-600 font-medium mb-1">Preview:</p>
              <p className="text-sm text-gray-800">
                You'll receive a reminder every{' '}
                <span className="font-semibold">
                  {DAYS_OF_WEEK[dayOfWeek].label}
                </span>{' '}
                at{' '}
                <span className="font-semibold">
                  {timeSlot === 'morning' ? '9:00 AM' : '6:00 PM'}
                </span>
                {' '}when you have the journal app open.
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
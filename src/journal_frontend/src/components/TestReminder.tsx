import { useState, useEffect } from 'react';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { Bell, Clock, Calendar } from 'lucide-react';

interface WeeklyReminderSectionProps {
  settings?: any;
  onChange: (settings: any) => void;
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sun' },
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' }
];

const TIME_SLOTS = [
  { value: 'morning', label: 'Morning (9AM)', icon: '🌅' },
  { value: 'afternoon', label: 'Afternoon (6PM)', icon: '🌆' }
];

export default function TestReminder({ settings, onChange }: WeeklyReminderSectionProps) {
  // Initialize state from props - will update when props change
  const [enabled, setEnabled] = useState(() => settings?.enabled ?? false);
  const [dayOfWeek, setDayOfWeek] = useState(() => settings?.dayOfWeek ?? 1);
  const [timeSlot, setTimeSlot] = useState<'morning' | 'afternoon'>(() => {
    if (settings?.timeSlot && 'afternoon' in settings.timeSlot) {
      return 'afternoon';
    }
    return 'morning';
  });

  // Sync with props when they change (but prevent infinite loops)
  useEffect(() => {
    console.log('TestReminder: Props changed, settings:', settings);
    
    if (settings) {
      const newEnabled = settings.enabled ?? false;
      const newDayOfWeek = settings.dayOfWeek ?? 1;
      const newTimeSlot = (settings.timeSlot && 'afternoon' in settings.timeSlot) ? 'afternoon' : 'morning';
      
      console.log('TestReminder: Setting state to:', { enabled: newEnabled, dayOfWeek: newDayOfWeek, timeSlot: newTimeSlot });
      
      setEnabled(newEnabled);
      setDayOfWeek(newDayOfWeek);
      setTimeSlot(newTimeSlot);
    } else {
      console.log('TestReminder: No settings, resetting to defaults');
      setEnabled(false);
      setDayOfWeek(1);
      setTimeSlot('morning');
    }
  }, [settings]);

  const handleEnableChange = () => {
    const newEnabled = !enabled;
    setEnabled(newEnabled);
    
    if (newEnabled) {
      const newSettings = {
        enabled: true,
        dayOfWeek,
        timeSlot: { [timeSlot]: null }
      };
      onChange(newSettings);
    } else {
      onChange(undefined);
    }
  };

  const handleDayChange = (day: number) => {
    setDayOfWeek(day);
    if (enabled) {
      const newSettings = {
        enabled: true,
        dayOfWeek: day,
        timeSlot: { [timeSlot]: null }
      };
      onChange(newSettings);
    }
  };

  const handleTimeChange = (newTimeSlot: 'morning' | 'afternoon') => {
    setTimeSlot(newTimeSlot);
    if (enabled) {
      const newSettings = {
        enabled: true,
        dayOfWeek,
        timeSlot: { [newTimeSlot]: null }
      };
      onChange(newSettings);
    }
  };

  return (
    <div className="space-y-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
      {/* Enable Reminders Section */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Bell className="w-4 h-4 text-purple-600" />
          <Label className="text-sm font-medium text-gray-700">
            Enable weekly reminders
          </Label>
        </div>
        <Button
          type="button"
          size="sm"
          variant={enabled ? "default" : "outline"}
          onClick={handleEnableChange}
          className={`px-3 py-1 text-xs font-medium ${
            enabled 
              ? "bg-purple-600 hover:bg-purple-700 text-white border-purple-600" 
              : "bg-white hover:bg-gray-50 text-gray-700 border-gray-300"
          }`}
        >
          {enabled ? "ON" : "OFF"}
        </Button>
      </div>

      {/* Settings Section - Only show when enabled */}
      {enabled && (
        <>
          {/* Day Selection */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-purple-600" />
              <Label className="text-xs font-medium text-gray-600">Day</Label>
            </div>
            <div className="grid grid-cols-7 gap-1">
              {DAYS_OF_WEEK.map((day) => (
                <Button
                  key={day.value}
                  type="button"
                  variant={dayOfWeek === day.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleDayChange(day.value)}
                  className={`text-xs h-8 ${
                    dayOfWeek === day.value
                      ? "bg-purple-600 hover:bg-purple-700 text-white"
                      : "border-purple-200 hover:bg-purple-50 text-gray-700"
                  }`}
                >
                  {day.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Time Selection */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-purple-600" />
              <Label className="text-xs font-medium text-gray-600">Time</Label>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {TIME_SLOTS.map((slot) => (
                <Button
                  key={slot.value}
                  type="button"
                  variant={timeSlot === slot.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleTimeChange(slot.value as 'morning' | 'afternoon')}
                  className={`text-xs h-8 ${
                    timeSlot === slot.value
                      ? "bg-purple-600 hover:bg-purple-700 text-white"
                      : "border-purple-200 hover:bg-purple-50 text-gray-700"
                  }`}
                >
                  <span className="mr-1">{slot.icon}</span>
                  {slot.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="p-2 bg-white rounded border text-center">
            <p className="text-xs text-gray-600">
              Remind me every{' '}
              <span className="font-semibold text-purple-600">
                {DAYS_OF_WEEK.find(d => d.value === dayOfWeek)?.label}
              </span>{' '}
              at{' '}
              <span className="font-semibold text-purple-600">
                {timeSlot === 'morning' ? '9:00 AM' : '6:00 PM'}
              </span>
            </p>
          </div>
        </>
      )}
    </div>
  );
}
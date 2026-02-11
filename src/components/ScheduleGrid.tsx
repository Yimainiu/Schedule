import React, { useState } from 'react';

interface ScheduleGridProps {
  currentUserAvailability: string[];
  allParticipants: any[];
  onAvailabilityChange: (availability: string[]) => void;
  viewMode: 'common' | 'individual';
  selectedUserAvailability: string[];
  isCurrentUserEditing: boolean;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

export function ScheduleGrid({
  currentUserAvailability,
  allParticipants,
  onAvailabilityChange,
  viewMode,
  selectedUserAvailability,
  isCurrentUserEditing,
}: ScheduleGridProps) {
  const [hoveredSlot, setHoveredSlot] = useState<string | null>(null);

  const getCellKey = (day: number, hour: number) => `${day}-${hour}`;

  const toggleAvailability = (day: number, hour: number) => {
    if (!isCurrentUserEditing) return;

    const key = getCellKey(day, hour);
    const newAvailability = currentUserAvailability.includes(key)
      ? currentUserAvailability.filter(k => k !== key)
      : [...currentUserAvailability, key];
    
    onAvailabilityChange(newAvailability);
  };

  const getAvailableParticipants = (day: number, hour: number) => {
    const key = getCellKey(day, hour);
    return allParticipants.filter(p => !p.availability.includes(key));
  };

  const getCellColor = (day: number, hour: number) => {
    const key = getCellKey(day, hour);

    if (viewMode === 'individual') {
      return selectedUserAvailability.includes(key)
        ? 'bg-red-500'
        : 'bg-white hover:bg-gray-100';
    }

    // Common view
    if (isCurrentUserEditing && currentUserAvailability.includes(key)) {
      return 'bg-red-500 border-2 border-red-700';
    }

    const availableCount = getAvailableParticipants(day, hour).length;
    const totalCount = allParticipants.length;
    const ratio = availableCount / totalCount;

    if (ratio === 0) return 'bg-red-700'; // Dark red - no one available
    if (ratio < 0.5) return 'bg-red-300'; // Light red - most not available
    if (ratio < 1) return 'bg-green-300'; // Light green - some available
    return 'bg-green-600'; // Dark green - everyone available
  };

  const formatHour = (hour: number) => {
    return `${hour.toString().padStart(2, '0')}:00`;
  };

  return (
    <div className="bg-white rounded-lg shadow-xl p-6">
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-gray-800">
          {viewMode === 'common' ? 'Common Availability' : 'Individual Schedule'}
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          {isCurrentUserEditing ? 'Click on cells to mark when you are NOT available (red)' : 'Viewing schedule (read-only)'}
        </p>
        {viewMode === 'common' && (
          <div className="flex gap-4 mt-3 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-green-600 border border-gray-300"></div>
              <span className="text-xs text-gray-700">All available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-green-300 border border-gray-300"></div>
              <span className="text-xs text-gray-700">Most available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-red-300 border border-gray-300"></div>
              <span className="text-xs text-gray-700">Most unavailable</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-red-700 border border-gray-300"></div>
              <span className="text-xs text-gray-700">None available</span>
            </div>
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          <div className="grid grid-cols-8 gap-0 border border-gray-300">
            {/* Header row */}
            <div className="bg-gray-100 border-b border-r border-gray-300 p-2 font-semibold text-center text-sm">
              Time
            </div>
            {DAYS.map(day => (
              <div key={day} className="bg-gray-100 border-b border-r border-gray-300 p-2 font-semibold text-center text-sm">
                {day}
              </div>
            ))}

            {/* Time slots */}
            {HOURS.map(hour => (
              <React.Fragment key={hour}>
                <div className="bg-gray-50 border-b border-r border-gray-300 p-2 text-xs text-center font-medium">
                  {formatHour(hour)}
                </div>
                {DAYS.map((_, dayIndex) => {
                  const key = getCellKey(dayIndex, hour);
                  const availableParticipants = getAvailableParticipants(dayIndex, hour);
                  
                  return (
                    <div
                      key={key}
                      onClick={() => toggleAvailability(dayIndex, hour)}
                      onMouseEnter={() => setHoveredSlot(key)}
                      onMouseLeave={() => setHoveredSlot(null)}
                      className={`relative border-b border-r border-gray-300 h-8 ${getCellColor(dayIndex, hour)} ${
                        isCurrentUserEditing ? 'cursor-pointer' : 'cursor-default'
                      } transition-colors`}
                    >
                      {viewMode === 'common' && hoveredSlot === key && (
                        <div className="absolute z-10 bg-gray-900 text-white text-xs p-2 rounded shadow-lg left-0 top-full mt-1 min-w-[150px] max-w-[200px]">
                          <div className="font-semibold mb-1">Available ({availableParticipants.length}/{allParticipants.length}):</div>
                          {availableParticipants.length > 0 ? (
                            <ul className="list-disc list-inside">
                              {availableParticipants.map(p => (
                                <li key={p.userId}>{p.userName}</li>
                              ))}
                            </ul>
                          ) : (
                            <p className="italic">No one available</p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

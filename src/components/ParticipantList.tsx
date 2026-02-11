import React from 'react';
import { Trash2, Crown, User } from 'lucide-react';

interface ParticipantListProps {
  participants: any[];
  currentUserId: string;
  isAdmin: boolean;
  onSelectParticipant: (userId: string) => void;
  onDeleteParticipant: (userId: string) => void;
  selectedUserId: string | null;
}

export function ParticipantList({
  participants,
  currentUserId,
  isAdmin,
  onSelectParticipant,
  onDeleteParticipant,
  selectedUserId,
}: ParticipantListProps) {
  const adminId = participants.length > 0 ? participants[0].userId : null;

  const handleDelete = (userId: string, userName: string) => {
    if (window.confirm(`Are you sure you want to delete ${userName}'s schedule?`)) {
      onDeleteParticipant(userId);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-xl p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Participants</h2>
      <p className="text-sm text-gray-600 mb-4">
        {participants.length} {participants.length === 1 ? 'person' : 'people'} in this event
      </p>

      <div className="space-y-2">
        {participants.map(participant => (
          <div
            key={participant.userId}
            className={`p-3 rounded-lg border-2 transition ${
              selectedUserId === participant.userId
                ? 'border-indigo-500 bg-indigo-50'
                : 'border-gray-200 bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 flex-1">
                {participant.userId === adminId ? (
                  <Crown className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                ) : (
                  <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-800 truncate">
                    {participant.userName}
                    {participant.userId === currentUserId && (
                      <span className="text-xs text-gray-500 ml-1">(You)</span>
                    )}
                  </p>
                  {participant.userId === adminId && (
                    <p className="text-xs text-yellow-600">Admin</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {isAdmin && (
                  <button
                    onClick={() => onSelectParticipant(participant.userId)}
                    className={`px-3 py-1 text-xs rounded transition ${
                      selectedUserId === participant.userId
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {selectedUserId === participant.userId ? 'Viewing' : 'View'}
                  </button>
                )}
                {isAdmin && participant.userId !== currentUserId && (
                  <button
                    onClick={() => handleDelete(participant.userId, participant.userName)}
                    className="p-1 text-red-600 hover:bg-red-50 rounded transition"
                    title="Delete participant"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="mt-2 text-xs text-gray-600">
              {participant.availability.length > 0 ? (
                <span>{participant.availability.length} unavailable slots marked</span>
              ) : (
                <span className="text-gray-400">No unavailability marked</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {!isAdmin && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-800">
            <strong>Note:</strong> Admin can view individual schedules and delete participants.
          </p>
        </div>
      )}
    </div>
  );
}

import React, { useState } from 'react';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface EventSetupProps {
  onEventJoined: (data: any) => void;
}

export function EventSetup({ onEventJoined }: EventSetupProps) {
  const [eventName, setEventName] = useState('');
  const [createUserName, setCreateUserName] = useState('');
  const [joinUserName, setJoinUserName] = useState('');
  const [joinEventId, setJoinEventId] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [joinLoading, setJoinLoading] = useState(false);
  const [createError, setCreateError] = useState('');
  const [joinError, setJoinError] = useState('');

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    setCreateError('');

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-43faa9f5/events`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ eventName, userName: createUserName }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        onEventJoined(data);
      } else {
        const errorData = await response.json();
        setCreateError(errorData.error || 'Failed to create event');
      }
    } catch (err) {
      setCreateError('Network error. Please try again.');
      console.error('Error creating event:', err);
    } finally {
      setCreateLoading(false);
    }
  };

  const handleJoinEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setJoinLoading(true);
    setJoinError('');

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-43faa9f5/events/${joinEventId}/join`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userName: joinUserName }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        onEventJoined(data);
      } else {
        const errorData = await response.json();
        setJoinError(errorData.error || 'Failed to join event');
      }
    } catch (err) {
      setJoinError('Network error. Please try again.');
      console.error('Error joining event:', err);
    } finally {
      setJoinLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl p-8 max-w-4xl w-full">
        <h1 className="text-3xl font-bold text-gray-800 mb-2 text-center">Schedule Checker</h1>
        <p className="text-gray-600 text-center mb-8">Find common availability with your team</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Create Event Form */}
          <div className="border-r md:pr-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Create New Event</h2>
            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Event Name</label>
                <input
                  type="text"
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Team Meeting"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Your Name</label>
                <input
                  type="text"
                  value={createUserName}
                  onChange={(e) => setCreateUserName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="John Doe"
                  required
                />
              </div>
              {createError && <p className="text-red-600 text-sm">{createError}</p>}
              <button
                type="submit"
                disabled={createLoading}
                className="w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 font-semibold"
              >
                {createLoading ? 'Creating...' : 'Create Event'}
              </button>
            </form>
          </div>

          {/* Join Event Form */}
          <div className="md:pl-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Join Existing Event</h2>
            <form onSubmit={handleJoinEvent} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Event ID</label>
                <input
                  type="text"
                  value={joinEventId}
                  onChange={(e) => setJoinEventId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="abc123xyz"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Your Name</label>
                <input
                  type="text"
                  value={joinUserName}
                  onChange={(e) => setJoinUserName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Jane Smith"
                  required
                />
              </div>
              {joinError && <p className="text-red-600 text-sm">{joinError}</p>}
              <button
                type="submit"
                disabled={joinLoading}
                className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 font-semibold"
              >
                {joinLoading ? 'Joining...' : 'Join Event'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
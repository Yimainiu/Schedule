import React, { useState } from 'react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { X } from 'lucide-react';

interface EventModalProps {
  onClose: () => void;
  onEventJoined: (data: any) => void;
}

export function EventModal({ onClose, onEventJoined }: EventModalProps) {
  // Check for eventId in URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const urlEventId = urlParams.get('eventId');
  
  const [mode, setMode] = useState<'create' | 'join'>(urlEventId ? 'join' : 'create');
  const [eventName, setEventName] = useState('');
  const [userName, setUserName] = useState('');
  const [joinEventId, setJoinEventId] = useState(urlEventId || '');
  const [passcode, setPasscode] = useState('');
  const [isAdminLogin, setIsAdminLogin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-43faa9f5/events`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ eventName, userName: 'admin' }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        onEventJoined(data);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to create event');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Error creating event:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // If admin login mode, use admin login endpoint
      if (isAdminLogin) {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-43faa9f5/events/${joinEventId}/admin-login`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${publicAnonKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ passcode }),
          }
        );

        if (response.ok) {
          const data = await response.json();
          onEventJoined(data);
        } else {
          const errorData = await response.json();
          setError(errorData.error || 'Failed to login as admin');
        }
      } else {
        // Normal join as participant
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-43faa9f5/events/${joinEventId}/join`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${publicAnonKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userName }),
          }
        );

        if (response.ok) {
          const data = await response.json();
          onEventJoined(data);
        } else {
          const errorData = await response.json();
          setError(errorData.error || 'Failed to join event');
        }
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Error joining event:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            {mode === 'create' ? 'Create Event' : 'Join Event'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded transition"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setMode('create')}
            className={`flex-1 py-2 px-4 rounded-lg transition font-medium ${
              mode === 'create'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Create New
          </button>
          <button
            onClick={() => setMode('join')}
            className={`flex-1 py-2 px-4 rounded-lg transition font-medium ${
              mode === 'join'
                ? 'bg-green-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Join Existing
          </button>
        </div>

        {mode === 'create' ? (
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
                autoFocus
              />
            </div>
            <p className="text-sm text-gray-600">You will be automatically named as <span className="font-semibold">admin</span></p>
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 font-semibold"
            >
              {loading ? 'Creating...' : 'Create Event'}
            </button>
          </form>
        ) : (
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
                autoFocus
              />
            </div>

            <div className="flex items-center gap-2 pb-2">
              <input
                type="checkbox"
                id="adminLogin"
                checked={isAdminLogin}
                onChange={(e) => setIsAdminLogin(e.target.checked)}
                className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
              />
              <label htmlFor="adminLogin" className="text-sm font-medium text-gray-700">
                I am the admin (login with passcode)
              </label>
            </div>

            {isAdminLogin ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Admin Passcode</label>
                <input
                  type="password"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Enter admin passcode"
                  required
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Your Name</label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Jane Smith"
                  required
                />
              </div>
            )}

            {error && <p className="text-red-600 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 font-semibold"
            >
              {loading ? (isAdminLogin ? 'Logging in...' : 'Joining...') : (isAdminLogin ? 'Login as Admin' : 'Join Event')}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
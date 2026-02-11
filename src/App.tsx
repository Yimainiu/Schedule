import React, { useState, useEffect } from 'react';
import { ScheduleGrid } from './components/ScheduleGrid';
import { ParticipantList } from './components/ParticipantList';
import { EventModal } from './components/EventModal';
import { projectId, publicAnonKey } from './utils/supabase/info';
import { Copy, Plus, Share2 } from 'lucide-react';

export default function App() {
  const [eventId, setEventId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [passcode, setPasscode] = useState<string | null>(null);
  const [eventData, setEventData] = useState<any>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);

  // Check for eventId in URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlEventId = urlParams.get('eventId');
    
    if (urlEventId) {
      // Open the modal in join mode with the event ID pre-filled
      setShowEventModal(true);
      // Don't fetch event data yet - wait until user actually joins
      return;
    }
  }, []);

  // Load from localStorage
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlEventId = urlParams.get('eventId');
    
    // Don't load from localStorage if there's a URL eventId (user is joining via link)
    if (urlEventId) {
      return;
    }

    const savedEventId = localStorage.getItem('scheduleChecker_eventId');
    const savedUserId = localStorage.getItem('scheduleChecker_userId');
    const savedIsAdmin = localStorage.getItem('scheduleChecker_isAdmin') === 'true';
    const savedPasscode = localStorage.getItem('scheduleChecker_passcode');

    if (savedEventId && savedUserId) {
      setEventId(savedEventId);
      setUserId(savedUserId);
      setIsAdmin(savedIsAdmin);
      setPasscode(savedPasscode);
    }
  }, []);

  // Fetch event data
  useEffect(() => {
    if (!eventId) return;

    const fetchEventData = async () => {
      try {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-43faa9f5/events/${eventId}`,
          {
            headers: {
              'Authorization': `Bearer ${publicAnonKey}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          setEventData(data);
        } else {
          console.error('Failed to fetch event data:', await response.text());
        }
      } catch (error) {
        console.error('Error fetching event data:', error);
      }
    };

    fetchEventData();
    const interval = setInterval(fetchEventData, 2000); // Poll every 2 seconds for real-time updates

    return () => clearInterval(interval);
  }, [eventId]);

  const handleEventJoined = (data: any) => {
    setEventId(data.eventId);
    setUserId(data.userId);
    setIsAdmin(data.isAdmin);
    setPasscode(data.passcode || null);

    // Save to localStorage
    localStorage.setItem('scheduleChecker_eventId', data.eventId);
    localStorage.setItem('scheduleChecker_userId', data.userId);
    localStorage.setItem('scheduleChecker_isAdmin', data.isAdmin.toString());
    if (data.passcode) {
      localStorage.setItem('scheduleChecker_passcode', data.passcode);
    }

    setShowEventModal(false);
  };

  const handleLeaveEvent = () => {
    setEventId(null);
    setUserId(null);
    setIsAdmin(false);
    setPasscode(null);
    setEventData(null);
    setSelectedUserId(null);

    localStorage.removeItem('scheduleChecker_eventId');
    localStorage.removeItem('scheduleChecker_userId');
    localStorage.removeItem('scheduleChecker_isAdmin');
    localStorage.removeItem('scheduleChecker_passcode');
  };

  const handleAvailabilityChange = async (availability: string[]) => {
    if (!eventId || !userId) return;

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-43faa9f5/events/${eventId}/availability`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId, availability }),
        }
      );

      if (!response.ok) {
        console.error('Failed to update availability:', await response.text());
      }
    } catch (error) {
      console.error('Error updating availability:', error);
    }
  };

  const handleDeleteParticipant = async (participantId: string) => {
    if (!eventId || !userId || !isAdmin || !passcode) return;

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-43faa9f5/events/${eventId}/participants/${participantId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ adminUserId: userId, passcode }),
        }
      );

      if (!response.ok) {
        console.error('Failed to delete participant:', await response.text());
      }
    } catch (error) {
      console.error('Error deleting participant:', error);
    }
  };

  const copyToClipboard = async (text: string, successMessage: string) => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        alert(successMessage);
        return;
      }
    } catch (_) {}
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      alert(successMessage);
    } catch (err) {
      console.error('Failed to copy:', err);
      prompt('Copy:', text);
    } finally {
      document.body.removeChild(textarea);
    }
  };

  const handleCopyEventId = () => {
    if (!eventId) return;
    copyToClipboard(eventId, 'Event ID copied to clipboard!');
  };

  const handleShareEvent = () => {
    if (!eventId) return;
    const shareUrl = `${window.location.origin}?eventId=${eventId}`;
    copyToClipboard(shareUrl, 'Share link copied to clipboard!');
  };

  const currentUser = eventData?.participants.find((p: any) => p.userId === userId);
  const displayUser = selectedUserId
    ? eventData?.participants.find((p: any) => p.userId === selectedUserId)
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-xl p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                {eventData ? eventData.eventName : 'Schedule Checker'}
              </h1>
              {currentUser ? (
                <>
                  <p className="text-gray-600 mt-1">
                    Logged in as: <span className="font-semibold">{currentUser.userName}</span>
                    {isAdmin && <span className="ml-2 text-indigo-600 text-sm">(Admin - Passcode: {passcode})</span>}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">Event ID: {eventId}</p>
                </>
              ) : (
                <p className="text-gray-600 mt-1">Find common availability with your team</p>
              )}
            </div>
            <div className="flex gap-3">
              {!eventId ? (
                <button
                  onClick={() => setShowEventModal(true)}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-semibold flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Create Event
                </button>
              ) : (
                <>
                  <button
                    onClick={handleCopyEventId}
                    className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition flex items-center gap-2"
                    title="Copy Event ID"
                  >
                    <Copy className="w-4 h-4" />
                    Copy Event ID
                  </button>
                  <button
                    onClick={handleShareEvent}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2"
                  >
                    <Share2 className="w-4 h-4" />
                    Share
                  </button>
                  <button
                    onClick={handleLeaveEvent}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                  >
                    Leave Event
                  </button>
                </>
              )}
            </div>
          </div>

          {selectedUserId && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex justify-between items-center">
              <p className="text-blue-800">
                Viewing schedule for: <span className="font-semibold">{displayUser?.userName}</span>
              </p>
              <button
                onClick={() => setSelectedUserId(null)}
                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
              >
                Back to Common View
              </button>
            </div>
          )}
        </div>

        {!eventId ? (
          <div className="bg-white rounded-lg shadow-xl p-12 text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Get Started</h2>
            <p className="text-gray-600 mb-6">Create a new event or join an existing one to start scheduling</p>
            <button
              onClick={() => setShowEventModal(true)}
              className="px-8 py-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-semibold text-lg"
            >
              Create or Join Event
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3">
              <ScheduleGrid
                currentUserAvailability={currentUser?.availability || []}
                allParticipants={eventData?.participants || []}
                onAvailabilityChange={handleAvailabilityChange}
                viewMode={selectedUserId ? 'individual' : 'common'}
                selectedUserAvailability={displayUser?.availability || []}
                isCurrentUserEditing={!selectedUserId}
              />
            </div>

            <div className="lg:col-span-1">
              <ParticipantList
                participants={eventData?.participants || []}
                currentUserId={userId}
                isAdmin={isAdmin}
                onSelectParticipant={setSelectedUserId}
                onDeleteParticipant={handleDeleteParticipant}
                selectedUserId={selectedUserId}
              />
            </div>
          </div>
        )}
      </div>

      {showEventModal && (
        <EventModal
          onClose={() => setShowEventModal(false)}
          onEventJoined={handleEventJoined}
        />
      )}
    </div>
  );
}
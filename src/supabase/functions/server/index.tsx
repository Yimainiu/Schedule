import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { logger } from 'npm:hono/logger';
import * as kv from './kv_store.tsx';

const app = new Hono();

app.use('*', cors());
app.use('*', logger(console.log));

// Generate random passcode
function generatePasscode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Create a new event
app.post('/make-server-43faa9f5/events', async (c) => {
  try {
    const { eventName, userName } = await c.req.json();
    
    if (!eventName || !userName) {
      return c.json({ error: 'Event name and user name are required' }, 400);
    }

    const eventId = Math.random().toString(36).substring(2, 15);
    const userId = Math.random().toString(36).substring(2, 15);
    const passcode = generatePasscode();

    const eventData = {
      eventId,
      eventName,
      admin: userId,
      passcode,
      participants: [{ userId, userName }],
      createdAt: Date.now(),
    };

    await kv.set(`event_${eventId}`, eventData);
    await kv.set(`schedule_${eventId}_${userId}`, { availability: [] });

    return c.json({ eventId, userId, passcode, isAdmin: true });
  } catch (error) {
    console.log('Error creating event:', error);
    return c.json({ error: `Failed to create event: ${error}` }, 500);
  }
});

// Join an existing event
app.post('/make-server-43faa9f5/events/:eventId/join', async (c) => {
  try {
    const eventId = c.req.param('eventId');
    const { userName } = await c.req.json();

    if (!userName) {
      return c.json({ error: 'User name is required' }, 400);
    }

    const eventData = await kv.get(`event_${eventId}`);
    if (!eventData) {
      return c.json({ error: 'Event not found' }, 404);
    }

    const userId = Math.random().toString(36).substring(2, 15);
    
    eventData.participants.push({ userId, userName });
    await kv.set(`event_${eventId}`, eventData);
    await kv.set(`schedule_${eventId}_${userId}`, { availability: [] });

    return c.json({ eventId, userId, isAdmin: false });
  } catch (error) {
    console.log('Error joining event:', error);
    return c.json({ error: `Failed to join event: ${error}` }, 500);
  }
});

// Admin login with passcode
app.post('/make-server-43faa9f5/events/:eventId/admin-login', async (c) => {
  try {
    const eventId = c.req.param('eventId');
    const { passcode } = await c.req.json();

    if (!passcode) {
      return c.json({ error: 'Passcode is required' }, 400);
    }

    const eventData = await kv.get(`event_${eventId}`);
    if (!eventData) {
      return c.json({ error: 'Event not found' }, 404);
    }

    if (eventData.passcode !== passcode) {
      return c.json({ error: 'Invalid passcode' }, 401);
    }

    return c.json({ 
      eventId, 
      userId: eventData.admin, 
      passcode: eventData.passcode,
      isAdmin: true 
    });
  } catch (error) {
    console.log('Error admin login:', error);
    return c.json({ error: `Failed to login as admin: ${error}` }, 500);
  }
});

// Get event data
app.get('/make-server-43faa9f5/events/:eventId', async (c) => {
  try {
    const eventId = c.req.param('eventId');
    
    const eventData = await kv.get(`event_${eventId}`);
    if (!eventData) {
      return c.json({ error: 'Event not found' }, 404);
    }

    // Get all schedules for this event
    const scheduleKeys = eventData.participants.map(p => `schedule_${eventId}_${p.userId}`);
    const schedules = await kv.mget(scheduleKeys);
    
    const participantsWithSchedules = eventData.participants.map((p, i) => ({
      ...p,
      availability: schedules[i]?.availability || [],
    }));

    return c.json({
      ...eventData,
      participants: participantsWithSchedules,
    });
  } catch (error) {
    console.log('Error getting event data:', error);
    return c.json({ error: `Failed to get event data: ${error}` }, 500);
  }
});

// Update user availability
app.post('/make-server-43faa9f5/events/:eventId/availability', async (c) => {
  try {
    const eventId = c.req.param('eventId');
    const { userId, availability } = await c.req.json();

    if (!userId || !availability) {
      return c.json({ error: 'User ID and availability are required' }, 400);
    }

    const eventData = await kv.get(`event_${eventId}`);
    if (!eventData) {
      return c.json({ error: 'Event not found' }, 404);
    }

    // Check if user is part of the event
    const userExists = eventData.participants.some(p => p.userId === userId);
    if (!userExists) {
      return c.json({ error: 'User not part of this event' }, 403);
    }

    await kv.set(`schedule_${eventId}_${userId}`, { availability });

    return c.json({ success: true });
  } catch (error) {
    console.log('Error updating availability:', error);
    return c.json({ error: `Failed to update availability: ${error}` }, 500);
  }
});

// Delete participant schedule (admin only)
app.delete('/make-server-43faa9f5/events/:eventId/participants/:participantId', async (c) => {
  try {
    const eventId = c.req.param('eventId');
    const participantId = c.req.param('participantId');
    const { adminUserId, passcode } = await c.req.json();

    const eventData = await kv.get(`event_${eventId}`);
    if (!eventData) {
      return c.json({ error: 'Event not found' }, 404);
    }

    // Verify admin
    if (eventData.admin !== adminUserId || eventData.passcode !== passcode) {
      return c.json({ error: 'Unauthorized: Admin privileges required' }, 403);
    }

    // Remove participant from event
    eventData.participants = eventData.participants.filter(p => p.userId !== participantId);
    await kv.set(`event_${eventId}`, eventData);
    
    // Delete their schedule
    await kv.del(`schedule_${eventId}_${participantId}`);

    return c.json({ success: true });
  } catch (error) {
    console.log('Error deleting participant:', error);
    return c.json({ error: `Failed to delete participant: ${error}` }, 500);
  }
});

Deno.serve(app.fetch);
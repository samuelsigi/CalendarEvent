import { IncomingMessage, ServerResponse } from 'http';
import CalendarEvent from '../models/CalendarEvent.js';
import { CustomRequest } from '../middleware/jwt.js';

// Helper to parse JSON body
const parseRequestBody = async (req: IncomingMessage): Promise<Record<string, unknown>> => {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });

    req.on('end', () => {
      if (!body) {
        reject(new Error('Request body is empty'));
        return;
      }
      try {
        const parsedBody = JSON.parse(body);
        resolve(parsedBody);
      } catch (error) {
        console.error('Error parsing JSON:', error.message);
        reject(new Error('Invalid JSON in request body'));
      }
    });

    req.on('error', (err) => {
      console.error('Stream error:', err.message);
      reject(new Error('Error reading request body'));
    });

    // Timeout to avoid hanging requests
    setTimeout(() => {
      if (!body) {
        console.error('Request timed out');
        reject(new Error('Request timed out'));
      }
    }, 5000); // 5 seconds timeout
  });
};

// Get all events
export const getEvents = async (_req: IncomingMessage, res: ServerResponse): Promise<void> => {
  try {
    const events = await CalendarEvent.find();

    if (!events || events.length === 0) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'No events found' }));
      return;
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(events));
  } catch (error: unknown) {
    console.error('Error fetching events:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Failed to fetch events' }));
  }
};


export const createEvent = async (req: CustomRequest, res: ServerResponse): Promise<void> => {
  try {
    const requestBody = await parseRequestBody(req);

    const { id, title, startDateTime, endDateTime, description } = requestBody as {
      id: string;
      title: string;
      startDateTime: string;
      endDateTime: string;
      description?: string;
    };

    // Validation logic
    if (!id || typeof id !== 'string') throw new Error('Invalid or missing id');
    if (!title || typeof title !== 'string' || title.trim() === '') throw new Error('Invalid or missing title');
    if (!startDateTime || isNaN(Date.parse(startDateTime))) throw new Error('Invalid or missing startDateTime');
    if (!endDateTime || isNaN(Date.parse(endDateTime))) throw new Error('Invalid or missing endDateTime');
    if (new Date(startDateTime) >= new Date(endDateTime)) throw new Error('startDateTime must be before endDateTime');
    if (description && typeof description !== 'string') throw new Error('Invalid description');

    const newEvent = new CalendarEvent({ id, title, startDateTime, endDateTime, description, userId:req.user.id });
    await newEvent.save();

    res.writeHead(201, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({newEvent, userId: req.user.id}));
  } catch (error) {
    console.error('Error creating event:', error.message);
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: (error as Error).message }));
  }
};


export const updateEvent = async (req, res, id): Promise<void> => {
  try {
    if (!id) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Valid Event ID is required' }));
      return;
    }

    const updatedData = await parseRequestBody(req);

    // Validation for fields
    if (updatedData.title && (typeof updatedData.title !== 'string' || updatedData.title.trim() === '')) {
      throw new Error('Invalid title: must be a non-empty string');
    }

    if (updatedData.startDateTime && isNaN(Date.parse(updatedData.startDateTime as string))) {
      throw new Error('Invalid startDateTime: must be a valid date');
    }

    if (updatedData.endDateTime && isNaN(Date.parse(updatedData.endDateTime as string))) {
      throw new Error('Invalid endDateTime: must be a valid date');
    }

    if (
      updatedData.startDateTime &&
      updatedData.endDateTime &&
      new Date(updatedData.startDateTime as string) >= new Date(updatedData.endDateTime as string)
    ) {
      throw new Error('startDateTime must be before endDateTime');
    }

    if (updatedData.description && typeof updatedData.description !== 'string') {
      throw new Error('Invalid description: must be a string');
    }

    // Update in the database
    const updatedEvent = await CalendarEvent.findByIdAndUpdate(id, updatedData, { new: true });

    if (!updatedEvent) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Event not found' }));
      return;
    }

    // Respond with the updated event
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(updatedEvent));
  } catch (error) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to update event' }));
  }
};


// Delete an event
export const deleteEvent = async (_req, res, id): Promise<void> => {
  try {
    if (!id) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Event ID is required' }));
      return;
    }

    const deletedEvent = await CalendarEvent.findByIdAndDelete(id);

    if (!deletedEvent) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Event not found' }));
      return;
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: 'Event deleted successfully' }));
  } catch (error) {
    console.log(error)
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Failed to delete event' }));
  }
};

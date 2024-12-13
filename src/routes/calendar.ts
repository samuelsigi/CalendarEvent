import { ServerResponse } from 'http';
import { getEvents, createEvent, updateEvent, deleteEvent } from '../controllers/calendarController.js';
import { parse } from 'url';
import { authenticateToken, CustomRequest } from '../middleware/jwt.js';




export const router = async (req: CustomRequest, res: ServerResponse): Promise<void> => {
  const { pathname } = parse(req.url || '', true);
  const pathParts = pathname?.split('/').filter(Boolean); // Split path and remove empty parts

  // Middleware to handle token-based authentication
  const requireAuth = async () => {
    return new Promise((resolve, reject) => {
      authenticateToken(req, res, (err?: Error) => {
        if (err) reject(err);
        else resolve(null);
      });
    });
  };

  try {
    if (pathname === '/api/events' && req.method === 'GET') {
      await getEvents(req, res); // Public route
    } else if (pathname === '/api/events' && req.method === 'POST') {
      await requireAuth(); // Protected route
      await createEvent(req, res);
    } else if (pathParts[0] === 'api' && pathParts[1] === 'events' && pathParts.length === 3) {
      const id = pathParts[2]; // Extract ID from URL path

      if (req.method === 'PUT') {
        await requireAuth(); // Protected route
        await updateEvent(req, res, id);
      } else if (req.method === 'DELETE') {
        await requireAuth(); // Protected route
        await deleteEvent(req, res, id);
      } else {
        res.writeHead(405, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Method not allowed' }));
      }
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Route not found' }));
    }
  } catch (error) {
    console.error('Authentication or Route Error:', error.message);
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Unauthorized access' }));
  }
};

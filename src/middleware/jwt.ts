import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { IncomingMessage, ServerResponse } from 'http';

dotenv.config(); // Load environment variables from .env

// Secret key for signing the JWT
const SECRET_KEY = process.env.JWT_SECRET || 'default-secret-key';

// Define custom request type to include userId
export interface CustomRequest extends IncomingMessage {
  user?: {
    email: string;
    id: string;
  };
}

// Generate a JWT token with a userId
export const generateToken = (userId: string): string => {
  const payload = { userId }; // The user data to include in the token
  const options = { expiresIn: '1h' }; // Token expiration time
  return jwt.sign(payload, SECRET_KEY, options);
};

// Verify the JWT token and extract the userId
export const verifyToken = (token: string): string | null => {
  try {
    const decoded = jwt.verify(token, SECRET_KEY) as { userId: string };
    return decoded.userId; // Return the userId from the token
  } catch (error) {
    console.error('JWT verification failed:', error.message);
    return null; // Return null for an inalid token
  }
};

// Middleware to authenticate incoming requests
export const authenticateToken = async (
  req: CustomRequest,
  res: ServerResponse,
  next: () => void
): Promise<void> => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Extract token from "Bearer <token>"

  if (!token) {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Unauthorized: No token provided' }));
    return;
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY) as { userId: string };
    req.user = JSON.parse(decoded.userId); // Attach userId to the request object
    next(); // Proceed to the next middleware or route handler
  } catch (error) {
    console.error('JWT verification failed:', error.message);
    res.writeHead(403, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Forbidden: Invalid token' }));
  }
};

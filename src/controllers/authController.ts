import { IncomingMessage, ServerResponse } from 'http';
import bcrypt from 'bcryptjs';
import * as userModel from '../models/UserModel.js';
import { generateToken, verifyToken } from '../middleware/jwt.js';

const saltRounds = 10;
const tokenBlacklist: Set<string> = new Set();

// Register a new user
export const registerUser = async (req: IncomingMessage, res: ServerResponse): Promise<void> => {
    let body = '';
    req.on('data', (chunk: Buffer) => (body += chunk.toString()));
    req.on('end', async () => {
        try {
            const { name, email, password }: { name: string; email: string; password: string } = JSON.parse(body);
            const userExists = await userModel.findUserByEmail(email);
            if (userExists) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: 'User already exists' }));
                return; 
            }
            const hashedPassword = await bcrypt.hash(password.trim(), saltRounds);
            await userModel.addUser({ name, email, password: hashedPassword });
            res.writeHead(201, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'User registered successfully' }));
        } catch (err: any) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Server error', error: err.message }));
        }
    });
};

// Login user and authenticate
export const loginUser = async (req: IncomingMessage, res: ServerResponse): Promise<void> => {
    let body = '';
    req.on('data', (chunk: Buffer) => (body += chunk.toString()));
    req.on('end', async () => {
        try {
            const { email, password }: { email: string; password: string } = JSON.parse(body);
            const user = await userModel.findUserByEmail(email);
            if (!user) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: 'Invalid credentials' }));
                return;
            }
            const isMatch = await bcrypt.compare(password.trim(), user.password);
            if (!isMatch) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: 'Invalid Password' }));
                return;
            }
            const token = generateToken(JSON.stringify({ email: user.email, id: user._id }));
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                message: 'Login successful!',
                token,
                user: {
                    name: user.name,
                    email: user.email,
                    createdAt: user.createdAt,
                    updatedAt: user.updatedAt,
                },
            }));
        } catch (err: any) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Server error', error: err.message }));
        }
    });
};

// Logout user and invalidate token
export const logoutUser = (req: IncomingMessage, res: ServerResponse): void => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Authorization header missing' }));
        return;
    }
    const token = authHeader.split(' ')[1];
    if (!token) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Token missing' }));
        return;
    }
    tokenBlacklist.add(token); // Add token to the blacklist
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: 'Logout successful' }));
};

// Middleware to check token validity
export const authenticateToken = (req: IncomingMessage, res: ServerResponse, next: Function): void => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Authorization header missing' }));
        return;
    }
    const token = authHeader.split(' ')[1];
    if (tokenBlacklist.has(token)) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Token is blacklisted' }));
        return;
    }
    try {
        const user = verifyToken(token);
        req['user'] = user; // Attach user info to the request
        next();
    } catch (err) {
        res.writeHead(403, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Invalid or expired token' }));
    }
};

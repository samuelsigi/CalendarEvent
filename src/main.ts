/**
 * Some predefined delay values (in milliseconds).
 */
export enum Delays {
  Short = 500,
  Medium = 2000,
  Long = 5000,
}

/**
 * Returns a Promise<string> that resolves after a given time.
 *
 * @param {string} name - A name.
 * @param {number=} [delay=Delays.Medium] - A number of milliseconds to delay resolution of the Promise.
 * @returns {Promise<string>}
 */
function delayedHello(
  name: string,
  delay: number = Delays.Medium,
): Promise<string> {
  return new Promise((resolve: (value?: string) => void) =>
    setTimeout(() => resolve(`Hello, ${name}`), delay),
  );
}

// Please see the comment in the .eslintrc.json file about the suppressed rule!
// Below is an example of how to use ESLint errors suppression. You can read more
// at https://eslint.org/docs/latest/user-guide/configuring/rules#disabling-rules

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type, @typescript-eslint/no-explicit-any
export async function greeter(name: any) {
  // The name parameter should be of type string. Any is used only to trigger the rule.
  return await delayedHello(name, Delays.Long);
}

import http from 'http';
import connectDB from './config/database.js';
import { router } from './routes/calendar.js';
import { loginUser, registerUser} from './controllers/authController.js'; // Import auth handlers

// Connect to the database
(async (): Promise<void> => {
  await connectDB();
  console.log('MongoDB connected successfully');
})();

// Create the HTTP server
const server = http.createServer((req, res) => {
  if (req.url === '/' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Welcome to Calendar');
  } else if (req.url === '/login' && req.method === 'POST') {
    loginUser(req, res); // Handle login requests
  } else if (req.url === '/register' && req.method === 'POST') {
    registerUser(req, res); // Handle register requests
  } else {
    router(req, res); // Pass request and response to the router
  }
});

// Start the server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

import app from './app.js';
import dotenv from 'dotenv';

dotenv.config({ path: '../../../.env' });

// Without a secret every token check fails, which the frontend would read as
// "session expired" for everyone. Refuse to start instead.
if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET is not set. Add it to the root .env file; the API will not start without it.');
  process.exit(1);
}

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`API server is running on port ${PORT}`);
});

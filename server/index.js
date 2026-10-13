// Local development server. On Netlify the same Express app is wrapped by
// netlify/functions/api.js and served as a serverless function instead.
import { app } from './app.js';

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`KSB admin API listening on http://localhost:${PORT}`);
});

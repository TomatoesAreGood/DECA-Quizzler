// Loads server/.env before anything else reads process.env
import 'dotenv/config';
import { app } from './app.ts';

const port = Number(process.env.PORT) || 3000;

app.listen(port, (error) => {
  if (error) throw error;
  console.log(`Server listening on http://localhost:${port}`);
});

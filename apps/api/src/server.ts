import dotenv from 'dotenv';
import { createApp } from './app';
import { loadConfig } from './config';

dotenv.config();

const app = createApp();
const { port } = loadConfig(process.env);

app.listen(port, () => {
  console.log(`Infamous Freight API listening on ${port}`);
});

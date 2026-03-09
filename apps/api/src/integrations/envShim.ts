import 'dotenv/config';
import { EnvSchema } from '@infamous/shared';

export const env = EnvSchema.parse(process.env);

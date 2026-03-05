import 'dotenv/config';
import { EnvSchema } from '@infamous-freight/shared';

export const env = EnvSchema.parse(process.env);

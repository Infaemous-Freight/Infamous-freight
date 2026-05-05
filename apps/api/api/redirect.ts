import type { IncomingMessage, ServerResponse } from 'node:http';

export default function handler(_req: IncomingMessage, res: ServerResponse) {
  res.writeHead(308, {
    Location: 'https://www.infamousfreight.com/',
  });
  res.end();
}

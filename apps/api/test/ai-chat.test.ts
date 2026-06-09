import express from 'express';
import request from 'supertest';
import { createAiChatRouter } from '../src/ai-chat';

function createTestApp(streamChunks: string[], timeoutMs = 5_000) {
  const app = express();
  const create = jest.fn().mockResolvedValue((async function* () {
    for (const content of streamChunks) {
      yield { choices: [{ delta: { content } }] };
    }
  })());

  app.use(express.json());
  app.use((req, _res, next) => {
    req.requestId = 'test-request-id';
    next();
  });
  app.use(createAiChatRouter({
    timeoutMs,
    createClient: () => ({
      chat: {
        completions: {
          create,
        },
      },
    }),
  }));

  return { app, create };
}

describe('AI chat route', () => {
  afterEach(() => {
    delete process.env.AI_CHAT_MODEL;
    delete process.env.AI_CHAT_TIMEOUT_MS;
  });

  it('streams assistant responses as server-sent events', async () => {
    const { app, create } = createTestApp(['Freight ', 'support ready.']);

    const response = await request(app)
      .post('/api/chat')
      .send({ messages: [{ role: 'user', content: 'Can you help quote a lane?' }] })
      .expect(200);

    expect(response.headers['content-type']).toContain('text/event-stream');
    expect(response.text).toContain('data: {"content":"Freight "}');
    expect(response.text).toContain('data: {"content":"support ready."}');
    expect(response.text).toContain('data: [DONE]');
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'gpt-5.2',
        stream: true,
        messages: expect.arrayContaining([
          expect.objectContaining({ role: 'system' }),
          { role: 'user', content: 'Can you help quote a lane?' },
        ]),
      }),
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it('rejects requests without a user message', async () => {
    const { app, create } = createTestApp([]);

    const response = await request(app)
      .post('/api/chat')
      .send({ messages: [{ role: 'assistant', content: 'Hello.' }] })
      .expect(400);

    expect(response.body.error).toBe('missing_messages');
    expect(create).not.toHaveBeenCalled();
  });

  it('caps message history and message size before calling the model', async () => {
    const { app, create } = createTestApp(['Done.']);
    const longText = 'x'.repeat(5_000);
    const messages = Array.from({ length: 30 }, (_, index) => ({
      role: index % 2 === 0 ? 'user' : 'assistant',
      content: index === 29 ? longText : `message-${index}`,
    }));

    await request(app).post('/api/chat').send({ messages }).expect(200);

    const requestBody = create.mock.calls[0][0];
    const conversationMessages = requestBody.messages.filter((message: { role: string }) => message.role !== 'system');

    expect(requestBody.messages).toHaveLength(22);
    expect(requestBody.messages[0].role).toBe('system');
    expect(requestBody.messages[1]).toEqual(expect.objectContaining({
      role: 'system',
      content: expect.stringContaining('AI Core policy context:'),
    }));
    expect(conversationMessages).toHaveLength(20);
    expect(requestBody.messages.at(-1).content).toHaveLength(4_000);
  });

  it('rate limits chat requests after 20 requests per minute', async () => {
    const { app, create } = createTestApp(['Done.']);
    const payload = { messages: [{ role: 'user', content: 'Need lane support.' }] };

    for (let index = 0; index < 20; index += 1) {
      // eslint-disable-next-line no-await-in-loop
      await request(app).post('/api/chat').send(payload).expect(200);
    }

    await request(app).post('/api/chat').send(payload).expect(429);
    expect(create).toHaveBeenCalledTimes(20);
  });
});

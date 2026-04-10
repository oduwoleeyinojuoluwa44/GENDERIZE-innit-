import test from 'node:test';
import assert from 'node:assert/strict';

import type { VercelRequest } from '@vercel/node';

import handler from '../api/classify.js';

type MockResponse = {
  statusCode: number;
  headers: Record<string, string>;
  body: unknown;
  setHeader: (key: string, value: string) => void;
  status: (code: number) => MockResponse;
  json: (payload: unknown) => MockResponse;
  end: () => MockResponse;
};

function createResponse(): MockResponse {
  return {
    statusCode: 200,
    headers: {},
    body: null,
    setHeader(key, value) {
      this.headers[key] = value;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
    end() {
      return this;
    },
  };
}

function createRequest(query: VercelRequest['query']): VercelRequest {
  return {
    method: 'GET',
    query,
  } as VercelRequest;
}

test('handler returns success payload with cors header', async () => {
  const originalFetch = global.fetch;
  global.fetch = async () =>
    ({
      ok: true,
      json: async () => ({
        name: 'john',
        gender: 'male',
        probability: 0.99,
        count: 1234,
      }),
    } as Response);

  const response = createResponse();
  await handler(createRequest({ name: 'john' }), response as never);

  assert.equal(response.statusCode, 200);
  assert.equal(response.headers['Access-Control-Allow-Origin'], '*');
  assert.deepEqual(
    Object.keys((response.body as { data: Record<string, unknown> }).data).sort(),
    ['gender', 'is_confident', 'name', 'probability', 'processed_at', 'sample_size'].sort(),
  );

  global.fetch = originalFetch;
});

test('handler returns 502 on upstream failure', async () => {
  const originalFetch = global.fetch;
  global.fetch = async () => {
    throw new Error('network');
  };

  const response = createResponse();
  await handler(createRequest({ name: 'john' }), response as never);

  assert.equal(response.statusCode, 502);
  assert.deepEqual(response.body, {
    status: 'error',
    message: 'Failed to fetch prediction from Genderize',
  });

  global.fetch = originalFetch;
});

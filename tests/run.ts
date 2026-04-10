import assert from 'node:assert/strict';

import type { VercelRequest } from '@vercel/node';

import handler from '../api/classify.js';
import { transformPrediction } from '../src/lib/transform.js';
import { getValidatedName } from '../src/lib/validation.js';
import { HttpError } from '../src/types/index.js';

type SyncOrAsync = void | Promise<void>;

type MockResponse = {
  statusCode: number;
  headers: Record<string, string>;
  body: unknown;
  setHeader: (key: string, value: string) => void;
  status: (code: number) => MockResponse;
  json: (payload: unknown) => MockResponse;
  end: () => MockResponse;
};

const tests: Array<{ name: string; run: () => SyncOrAsync }> = [];

function test(name: string, run: () => SyncOrAsync) {
  tests.push({ name, run });
}

function createRequest(query: VercelRequest['query']): VercelRequest {
  return {
    method: 'GET',
    query,
  } as VercelRequest;
}

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

function expectHttpError(
  action: () => unknown,
  expectedStatusCode: number,
  expectedMessage: string,
) {
  assert.throws(
    action,
    (error: unknown) =>
      error instanceof HttpError &&
      error.statusCode === expectedStatusCode &&
      error.message === expectedMessage,
  );
}

test('returns trimmed name for valid string input', () => {
  const result = getValidatedName(createRequest({ name: '  john  ' }));
  assert.equal(result, 'john');
});

test('throws 400 when name is missing', () => {
  expectHttpError(() => getValidatedName(createRequest({})), 400, 'Missing name query parameter');
});

test('throws 400 when name is empty', () => {
  expectHttpError(
    () => getValidatedName(createRequest({ name: '   ' })),
    400,
    'Empty name query parameter',
  );
});

test('throws 422 when name is repeated', () => {
  expectHttpError(
    () => getValidatedName(createRequest({ name: ['john', 'jane'] })),
    422,
    'name must be a string',
  );
});

test('maps count to sample_size and computes confident result', () => {
  const result = transformPrediction('john', {
    name: 'john',
    gender: 'male',
    probability: 0.99,
    count: 1234,
  });

  assert.equal(result.name, 'john');
  assert.equal(result.gender, 'male');
  assert.equal(result.probability, 0.99);
  assert.equal(result.sample_size, 1234);
  assert.equal(result.is_confident, true);
  assert.match(result.processed_at, /^\d{4}-\d{2}-\d{2}T/);
});

test('returns false when one confidence condition fails', () => {
  const lowSample = transformPrediction('amy', {
    name: 'amy',
    gender: 'female',
    probability: 0.95,
    count: 50,
  });

  assert.equal(lowSample.is_confident, false);
});

test('throws no prediction error when gender is null', () => {
  expectHttpError(
    () =>
      transformPrediction('x', {
        name: 'x',
        gender: null,
        probability: 0,
        count: 0,
      }),
    422,
    'No prediction available for the provided name',
  );
});

test('handler returns success payload with cors header', async () => {
  const originalFetch = global.fetch;

  try {
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
  } finally {
    global.fetch = originalFetch;
  }
});

test('handler returns 502 on upstream failure', async () => {
  const originalFetch = global.fetch;

  try {
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
  } finally {
    global.fetch = originalFetch;
  }
});

async function runAllTests() {
  let failed = 0;

  for (const currentTest of tests) {
    try {
      await currentTest.run();
      console.log(`PASS ${currentTest.name}`);
    } catch (error) {
      failed += 1;
      console.error(`FAIL ${currentTest.name}`);
      console.error(error);
    }
  }

  if (failed > 0) {
    process.exitCode = 1;
    throw new Error(`${failed} test${failed === 1 ? '' : 's'} failed`);
  }

  console.log(`All ${tests.length} tests passed`);
}

runAllTests().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

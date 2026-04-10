import test from 'node:test';
import assert from 'node:assert/strict';

import { getValidatedName } from '../src/lib/validation.js';
import { HttpError } from '../src/types/index.js';

function createRequest(query: unknown) {
  return { query } as never;
}

test('returns trimmed name for valid string input', () => {
  const result = getValidatedName(createRequest({ name: '  john  ' }));
  assert.equal(result, 'john');
});

test('throws 400 when name is missing', () => {
  assert.throws(
    () => getValidatedName(createRequest({})),
    (error: unknown) =>
      error instanceof HttpError &&
      error.statusCode === 400 &&
      error.message === 'Missing name query parameter',
  );
});

test('throws 400 when name is empty', () => {
  assert.throws(
    () => getValidatedName(createRequest({ name: '   ' })),
    (error: unknown) =>
      error instanceof HttpError &&
      error.statusCode === 400 &&
      error.message === 'Empty name query parameter',
  );
});

test('throws 422 when name is repeated', () => {
  assert.throws(
    () => getValidatedName(createRequest({ name: ['john', 'jane'] })),
    (error: unknown) =>
      error instanceof HttpError &&
      error.statusCode === 422 &&
      error.message === 'name must be a string',
  );
});

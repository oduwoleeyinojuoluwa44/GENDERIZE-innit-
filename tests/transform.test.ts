import test from 'node:test';
import assert from 'node:assert/strict';

import { transformPrediction } from '../src/lib/transform.js';
import { HttpError } from '../src/types/index.js';

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
  assert.throws(
    () =>
      transformPrediction('x', {
        name: 'x',
        gender: null,
        probability: 0,
        count: 0,
      }),
    (error: unknown) =>
      error instanceof HttpError &&
      error.statusCode === 422 &&
      error.message === 'No prediction available for the provided name',
  );
});

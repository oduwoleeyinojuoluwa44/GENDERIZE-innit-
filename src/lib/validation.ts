import type { VercelRequest } from '@vercel/node';

import { HttpError } from '../types/index.js';

export function getValidatedName(request: VercelRequest) {
  const rawName = request.query.name;

  if (rawName === undefined) {
    throw new HttpError(400, 'Missing name query parameter');
  }

  if (Array.isArray(rawName)) {
    throw new HttpError(422, 'name must be a string');
  }

  if (typeof rawName !== 'string') {
    throw new HttpError(422, 'name must be a string');
  }

  const trimmedName = rawName.trim();
  if (!trimmedName) {
    throw new HttpError(400, 'Empty name query parameter');
  }

  return trimmedName;
}

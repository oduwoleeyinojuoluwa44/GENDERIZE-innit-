import type { VercelRequest, VercelResponse } from '@vercel/node';

import { fetchGenderizePrediction } from '../src/lib/genderize.js';
import { sendError, sendNoContent, sendSuccess } from '../src/lib/responses.js';
import { transformPrediction } from '../src/lib/transform.js';
import { getValidatedName } from '../src/lib/validation.js';
import { HttpError } from '../src/types/index.js';

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method === 'OPTIONS') {
    return sendNoContent(response);
  }

  if (request.method !== 'GET') {
    return sendError(response, 405, 'Method not allowed');
  }

  try {
    const name = getValidatedName(request);
    const prediction = await fetchGenderizePrediction(name);
    const result = transformPrediction(name, prediction);

    return sendSuccess(response, result);
  } catch (error) {
    if (error instanceof HttpError) {
      return sendError(response, error.statusCode, error.message);
    }

    return sendError(response, 500, 'Internal server error');
  }
}

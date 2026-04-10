import { HttpError, type ClassificationData, type GenderizeApiResponse } from '../types/index.js';

export function transformPrediction(
  requestedName: string,
  payload: GenderizeApiResponse,
): ClassificationData {
  if (payload.gender === null || payload.count === 0) {
    throw new HttpError(422, 'No prediction available for the provided name');
  }

  if (
    payload.gender === null ||
    payload.probability === null ||
    payload.count === null
  ) {
    throw new HttpError(502, 'Invalid response received from Genderize');
  }

  return {
    name: requestedName,
    gender: payload.gender,
    probability: payload.probability,
    sample_size: payload.count,
    is_confident: payload.probability >= 0.7 && payload.count >= 100,
    processed_at: new Date().toISOString(),
  };
}

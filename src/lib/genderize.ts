import { HttpError, type GenderizeApiResponse } from '../types/index.js';

const GENDERIZE_API_URL = 'https://api.genderize.io';
const UPSTREAM_TIMEOUT_MS = 4000;

export async function fetchGenderizePrediction(name: string): Promise<GenderizeApiResponse> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);

  try {
    const url = new URL(GENDERIZE_API_URL);
    url.searchParams.set('name', name);

    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new HttpError(502, 'Failed to fetch prediction from Genderize');
    }

    const payload = (await response.json()) as Partial<GenderizeApiResponse>;

    return {
      name: typeof payload.name === 'string' ? payload.name : null,
      gender: typeof payload.gender === 'string' ? payload.gender : null,
      probability: typeof payload.probability === 'number' ? payload.probability : null,
      count: typeof payload.count === 'number' ? payload.count : null,
    };
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }

    throw new HttpError(502, 'Failed to fetch prediction from Genderize');
  } finally {
    clearTimeout(timeout);
  }
}

import type { VercelResponse } from '@vercel/node';

import type { ClassificationData, ErrorResponse, SuccessResponse } from '../types/index.js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export function setCorsHeaders(response: VercelResponse) {
  for (const [key, value] of Object.entries(corsHeaders)) {
    response.setHeader(key, value);
  }
}

export function sendSuccess(response: VercelResponse, data: ClassificationData) {
  setCorsHeaders(response);
  const payload: SuccessResponse = {
    status: 'success',
    data,
  };

  return response.status(200).json(payload);
}

export function sendError(response: VercelResponse, statusCode: number, message: string) {
  setCorsHeaders(response);
  const payload: ErrorResponse = {
    status: 'error',
    message,
  };

  return response.status(statusCode).json(payload);
}

export function sendNoContent(response: VercelResponse) {
  setCorsHeaders(response);
  return response.status(204).end();
}

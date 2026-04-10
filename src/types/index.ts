export type GenderizeApiResponse = {
  name: string | null;
  gender: string | null;
  probability: number | null;
  count: number | null;
};

export type ClassificationData = {
  name: string;
  gender: string;
  probability: number;
  sample_size: number;
  is_confident: boolean;
  processed_at: string;
};

export type SuccessResponse = {
  status: 'success';
  data: ClassificationData;
};

export type ErrorResponse = {
  status: 'error';
  message: string;
};

export class HttpError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

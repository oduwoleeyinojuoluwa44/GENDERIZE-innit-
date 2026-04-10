# Genderize API Backend

TypeScript backend for the HNG Backend Stage 0 assessment. It exposes one deploy-ready Vercel serverless endpoint that calls the Genderize API and returns a processed result.

## Endpoint

### `GET /api/classify?name={name}`

Example:

```bash
curl "http://localhost:3000/api/classify?name=john"
```

Success response:

```json
{
  "status": "success",
  "data": {
    "name": "john",
    "gender": "male",
    "probability": 0.99,
    "sample_size": 1234,
    "is_confident": true,
    "processed_at": "2026-04-10T10:00:00.000Z"
  }
}
```

Error response:

```json
{
  "status": "error",
  "message": "Missing name query parameter"
}
```

## Processing Rules

- Reads `gender`, `probability`, and `count` from Genderize
- Renames `count` to `sample_size`
- Computes `is_confident` as:
  - `probability >= 0.7`
  - `sample_size >= 100`
- Generates a fresh UTC ISO 8601 `processed_at` timestamp on every request

## Local Development

Install dependencies:

```bash
npm install
```

Start the local development server:

```bash
npm run dev
```

Type-check the project:

```bash
npm run typecheck
```

Run tests:

```bash
npm test
```

## Deployment to Vercel

1. Push this project to GitHub
2. Import the repo into Vercel
3. Deploy without extra environment variables
4. Use your deployed base URL with:

```text
https://your-domain.vercel.app/api/classify?name=john
```

## Stack

- TypeScript
- Vercel Serverless Functions
- Native `fetch`

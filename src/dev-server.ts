import http from 'node:http';
import { URL } from 'node:url';

import type { VercelRequest, VercelResponse } from '@vercel/node';

import handler from '../api/classify.js';

const port = Number(process.env.PORT ?? 3000);

const server = http.createServer((req, res) => {
  const requestUrl = new URL(req.url ?? '/', `http://${req.headers.host ?? `localhost:${port}`}`);

  const query = Object.fromEntries(requestUrl.searchParams.entries());
  const vercelLikeRequest = Object.assign(req, {
    query,
    url: requestUrl.pathname + requestUrl.search,
    method: req.method ?? 'GET',
  }) as VercelRequest;

  const vercelLikeResponse = Object.assign(res, {
    status(code: number) {
      res.statusCode = code;
      return vercelLikeResponse;
    },
    json(payload: unknown) {
      if (!res.getHeader('Content-Type')) {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
      }
      res.end(JSON.stringify(payload));
      return vercelLikeResponse;
    },
  }) as VercelResponse;

  if (requestUrl.pathname === '/api/classify') {
    void handler(vercelLikeRequest, vercelLikeResponse);
    return;
  }

  res.statusCode = 404;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify({ status: 'error', message: 'Not found' }));
});

server.listen(port, () => {
  console.log(`Local API server running on http://localhost:${port}`);
});

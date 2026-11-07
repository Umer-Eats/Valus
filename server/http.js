export class AppError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export function send(res, status, data) {
  res.statusCode = status;
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (status === 204) return res.end();
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(data));
}

export function failure(res, error) {
  if (error instanceof AppError) return send(res, error.status, { error: error.message });
  if (error instanceof SyntaxError) return send(res, 400, { error: 'The request could not be read.' });
  // Never log tokens, passwords or SQL. The error name is enough to start debugging.
  console.error('Valus request failed:', error instanceof Error ? error.name : 'Unknown error');
  return send(res, 503, { error: 'Valus is temporarily unavailable. Please try again.' });
}

// Large enough for a ranked mock procedure action log.
const MAX_BODY = 256 * 1024;

// Vercel pre-parses JSON into req.body; the local dev server hands us the raw stream.
export async function readBody(req) {
  if (req.body !== undefined) {
    if (typeof req.body === 'string') return req.body ? JSON.parse(req.body) : {};
    if (Buffer.isBuffer(req.body)) return req.body.length ? JSON.parse(req.body.toString('utf8')) : {};
    return req.body ?? {};
  }
  let size = 0;
  const chunks = [];
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY) throw new AppError(413, 'That request is too large.');
    chunks.push(chunk);
  }
  const text = Buffer.concat(chunks).toString('utf8');
  return text ? JSON.parse(text) : {};
}

export function text(value, label, { max = 200, required = true } = {}) {
  const clean = typeof value === 'string' ? value.trim() : '';
  if (!clean && required) throw new AppError(400, `Enter ${label}.`);
  if (clean.length > max) throw new AppError(400, `Keep ${label} under ${max.toLocaleString('en-US')} characters.`);
  return clean;
}

export const REQUEST_BODY_LIMIT = '100kb';

export const HTTP_HEADERS = {
  requestId: 'X-Request-Id',
  contentTypeOptions: 'X-Content-Type-Options',
  frameOptions: 'X-Frame-Options',
  referrerPolicy: 'Referrer-Policy',
  permissionsPolicy: 'Permissions-Policy',
  cacheControl: 'Cache-Control',
} as const;

export const HTTP_HEADER_VALUES = {
  contentTypeOptions: 'nosniff',
  frameOptions: 'DENY',
  referrerPolicy: 'no-referrer',
  permissionsPolicy: 'camera=(), microphone=(), geolocation=()',
  cacheControl: 'no-store',
} as const;

export const HTTP_STATUS = {
  accepted: 202,
  noContent: 204,
  notModified: 304,
  internalServerError: 500,
} as const;

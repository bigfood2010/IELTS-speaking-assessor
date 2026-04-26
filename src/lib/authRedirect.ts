const DEFAULT_AUTH_REDIRECT_PATH = '/app/dashboard';

export function getSafeAuthRedirectPath(
  next: string | null | undefined,
): string {
  if (!next || !next.startsWith('/') || next.startsWith('//')) {
    return DEFAULT_AUTH_REDIRECT_PATH;
  }

  if (next === '/login' || next.startsWith('/auth/callback')) {
    return DEFAULT_AUTH_REDIRECT_PATH;
  }

  return next;
}

export function buildAuthCallbackUrl(next: string): string {
  const callbackUrl = new URL('/auth/callback', window.location.origin);
  callbackUrl.searchParams.set('next', getSafeAuthRedirectPath(next));
  return callbackUrl.toString();
}

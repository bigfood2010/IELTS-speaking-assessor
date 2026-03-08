import { getSafeAuthRedirectPath } from './authRedirect';

export interface AuthCallbackState {
  nextPath: string;
  errorMessage: string | null;
  hasImplicitTokens: boolean;
}

export function parseAuthCallbackState(search: string, hash: string): AuthCallbackState {
  const searchParams = new URLSearchParams(search);
  const hashParams = new URLSearchParams(hash.startsWith('#') ? hash.slice(1) : hash);
  const errorMessage =
    searchParams.get('error_description') ||
    searchParams.get('error') ||
    hashParams.get('error_description') ||
    hashParams.get('error');

  return {
    nextPath: getSafeAuthRedirectPath(searchParams.get('next')),
    errorMessage,
    hasImplicitTokens: hashParams.has('access_token') || hashParams.has('refresh_token'),
  };
}

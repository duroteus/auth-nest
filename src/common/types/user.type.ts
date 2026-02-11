export interface UserWithFeatures {
  id?: string;
  username?: string;
  email?: string;
  features: string[];
}

export const ANONYMOUS_USER_FEATURES = [
  'read:activation_token',
  'create:session',
  'create:user',
];

export function createAnonymousUser(): UserWithFeatures {
  return {
    features: ANONYMOUS_USER_FEATURES,
  };
}

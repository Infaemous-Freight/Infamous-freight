export const AUTH_ERROR_CODES = {
  emailAlreadyRegistered: "EMAIL_ALREADY_REGISTERED",
  invalidCredentials: "INVALID_CREDENTIALS",
  invalidRefreshToken: "INVALID_REFRESH_TOKEN",
  authRequired: "AUTH_REQUIRED",
  inactiveUser: "INACTIVE_USER",
  userNotFound: "USER_NOT_FOUND",
} as const;

export const INVALID_CREDENTIALS_MESSAGE = "Invalid email or password";
export const REFRESH_TOKEN_COOKIE_BODY_FIELD = "refreshToken";
export const ACCESS_TOKEN_DEFAULT_ROLE = "user";

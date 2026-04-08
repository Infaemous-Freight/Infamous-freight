/**
 * Frontend API Client
 * Type-safe integration with backend API endpoints
 * Usage in React components with hooks
 */

import { ApiResponse } from "@infamous-freight/shared";

// API configuration
// Production: NEXT_PUBLIC_API_BASE_URL=https://api.infamousfreight.com
// NEXT_PUBLIC_API_URL is kept as a legacy alias for backward compatibility.
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:4000/api";

const AI_API_BASE_URL =
  process.env.NEXT_PUBLIC_AI_API_URL || process.env.NEXT_PUBLIC_AI_BASE_URL || API_BASE_URL;

const AI_OPTIMIZATION_ENDPOINT =
  process.env.NEXT_PUBLIC_AI_OPTIMIZATION_ENDPOINT || "/ai/shipment-optimization";

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  headers?: Record<string, string>;
  body?: Record<string, unknown>;
  params?: Record<string, string | number>;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  avatar?: string;
}

/**
 * Make authenticated API request
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {},
): Promise<ApiResponse<T>> {
  return requestWithBase<T>(API_BASE_URL, endpoint, options);
}

async function requestWithBase<T>(
  baseUrl: string,
  endpoint: string,
  options: RequestOptions = {},
): Promise<ApiResponse<T>> {
  const { method = "GET", body, params, headers = {} } = options;

  // Build URL with query params
  const normalizedBaseUrl = baseUrl.replace(/\/+$/, "");
  const normalizedEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  let url = `${normalizedBaseUrl}${normalizedEndpoint}`;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      searchParams.append(key, String(value));
    });
    url += `?${searchParams.toString()}`;
  }

  // Add auth token
  const token = getAccessToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    ...(body && { body: JSON.stringify(body) }),
  });

  // Handle token expiry
  if (response.status === 401) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      // Retry with new token
      return apiRequest<T>(endpoint, options);
    } else {
      // Redirect to login
      redirectToLogin();
    }
  }

  const data: ApiResponse<T> = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Request failed");
  }

  return data;
}

// ============================================================================
// AUTHENTICATION ENDPOINTS
// ============================================================================

interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

async function register(data: RegisterRequest): Promise<AuthTokens & User> {
  const response = await apiRequest<AuthTokens & User>("/auth/register", {
    method: "POST",
    // @ts-ignore - Body parameter type mismatch
    body: data,
  });

  if (response.success && response.data) {
    saveTokens(response.data);
    return response.data;
  }

  throw new Error(response.error || "Registration failed");
}

interface LoginRequest {
  email: string;
  password: string;
}

async function login(data: LoginRequest): Promise<AuthTokens & User> {
  const response = await apiRequest<AuthTokens & User>("/auth/login", {
    method: "POST",
    // @ts-ignore - Body parameter type mismatch
    body: data,
  });

  if (response.success && response.data) {
    saveTokens(response.data);
    return response.data;
  }

  throw new Error(response.error || "Login failed");
}

async function logout(): Promise<void> {
  await apiRequest("/auth/logout", { method: "POST" });
  clearTokens();
}

async function getCurrentUser(): Promise<User> {
  const response = await apiRequest<User>("/auth/me");

  if (response.success && response.data) {
    return response.data;
  }

  throw new Error("Failed to fetch user");
}

async function refreshAccessToken(): Promise<boolean> {
  try {
    const refreshToken = getRefreshToken();
    if (!refreshToken) return false;

    const response = await apiRequest<AuthTokens>("/auth/refresh", {
      method: "POST",
      body: { refreshToken },
    });

    if (response.success && response.data) {
      saveTokens(response.data);
      return true;
    }

    return false;
  } catch {
    return false;
  }
}

interface ForgotPasswordRequest {
  email: string;
}

async function forgotPassword(data: ForgotPasswordRequest): Promise<void> {
  const response = await apiRequest("/auth/forgot-password", {
    method: "POST",
    // @ts-ignore - Body parameter type mismatch
    body: data,
  });

  if (!response.success) {
    throw new Error(response.error || "Request failed");
  }
}

interface ResetPasswordRequest {
  token: string;
  password: string;
}

async function resetPassword(data: ResetPasswordRequest): Promise<void> {
  const response = await apiRequest("/auth/reset-password", {
    method: "POST",
    // @ts-ignore - Body parameter type mismatch
    body: data,
  });

  if (!response.success) {
    throw new Error(response.error || "Request failed");
  }
}

// ============================================================================
// BILLING ENDPOINTS
// ============================================================================

interface PaymentIntentRequest {
  amount: number;
  description: string;
  metadata?: Record<string, unknown>;
}

interface PaymentIntent {
  clientSecret: string;
  paymentIntentId: string;
  amount: number;
  currency: string;
}

async function createPaymentIntent(data: PaymentIntentRequest): Promise<PaymentIntent> {
  const response = await apiRequest<PaymentIntent>("/billing/create-payment-intent", {
    method: "POST",
    // @ts-ignore - Body parameter type mismatch
    body: data,
  });

  if (response.success && response.data) {
    return response.data;
  }

  throw new Error(response.error || "Failed to create payment intent");
}

interface SubscriptionRequest {
  priceId: string;
  trialDays?: number;
}

interface Subscription {
  subscriptionId: string;
  status: string;
  priceId: string;
  currentPeriodEnd: string;
}

async function createSubscription(data: SubscriptionRequest): Promise<Subscription> {
  const response = await apiRequest<Subscription>("/billing/create-subscription", {
    method: "POST",
    // @ts-ignore - Body parameter type mismatch
    body: data,
  });

  if (response.success && response.data) {
    return response.data;
  }

  throw new Error(response.error || "Failed to create subscription");
}

async function cancelSubscription(subscriptionId: string): Promise<Subscription> {
  const response = await apiRequest<Subscription>("/billing/cancel-subscription", {
    method: "POST",
    body: { subscriptionId },
  });

  if (response.success && response.data) {
    return response.data;
  }

  throw new Error(response.error || "Failed to cancel subscription");
}

interface Invoice {
  id: string;
  amount: number;
  status: string;
  created: string;
  dueDate?: string;
  paidAt?: string;
  downloadUrl?: string;
}

async function getInvoices(limit: number = 10): Promise<Invoice[]> {
  const response = await apiRequest<Invoice[]>("/billing/invoices", { params: { limit } });

  if (response.success && response.data) {
    return response.data;
  }

  return [];
}

async function getSubscription(): Promise<Subscription> {
  const response = await apiRequest<Subscription>("/billing/subscription");

  if (response.success && response.data) {
    return response.data;
  }

  throw new Error("No active subscription");
}

// ============================================================================
// AI ENDPOINTS
// ============================================================================

interface GenerateTextRequest {
  prompt: string;
  maxTokens?: number;
  temperature?: number;
}

interface GeneratedText {
  text: string;
  duration: number;
  provider: string;
}

async function generateText(data: GenerateTextRequest): Promise<GeneratedText> {
  // @ts-ignore - Body parameter type mismatch
  const response = await apiRequest<GeneratedText>("/ai/generate", { method: "POST", body: data });

  if (response.success && response.data) {
    return response.data;
  }

  throw new Error(response.error || "Text generation failed");
}

interface OptimizationSuggestion {
  shipmentId: string;
  suggestions: string[];
  provider: string;
}

async function getShipmentOptimization(shipmentId: string): Promise<OptimizationSuggestion> {
  const response = await requestWithBase<OptimizationSuggestion>(
    AI_API_BASE_URL,
    AI_OPTIMIZATION_ENDPOINT,
    { method: "POST", body: { shipmentId } },
  );

  if (response.success && response.data) {
    return response.data;
  }

  throw new Error(response.error || "Optimization generation failed");
}

interface SentimentAnalysis {
  sentiment: "positive" | "negative" | "neutral";
  confidence: number;
  emotion: string;
}

async function analyzeSentiment(text: string): Promise<SentimentAnalysis> {
  const response = await apiRequest<SentimentAnalysis>("/ai/sentiment-analysis", {
    method: "POST",
    body: { text },
  });

  if (response.success && response.data) {
    return response.data;
  }

  throw new Error(response.error || "Sentiment analysis failed");
}

interface Embedding {
  embedding: number[];
  dimension: number;
}

async function generateEmbedding(text: string): Promise<Embedding> {
  const response = await apiRequest<Embedding>("/ai/embedding", { method: "POST", body: { text } });

  if (response.success && response.data) {
    return response.data;
  }

  throw new Error(response.error || "Embedding generation failed");
}

interface VoiceCommand {
  intent: string;
  confidence: number;
  action: string;
  message: string;
}

async function processVoiceCommand(transcription: string): Promise<VoiceCommand> {
  const response = await apiRequest<VoiceCommand>("/ai/voice-command", {
    method: "POST",
    body: { transcription },
  });

  if (response.success && response.data) {
    return response.data;
  }

  throw new Error(response.error || "Voice command processing failed");
}

// ============================================================================
// TOKEN MANAGEMENT (Local Storage)
// ============================================================================

function saveTokens(tokens: Partial<AuthTokens>): void {
  if (tokens.accessToken) {
    localStorage.setItem("accessToken", tokens.accessToken);
  }
  if (tokens.refreshToken) {
    localStorage.setItem("refreshToken", tokens.refreshToken);
  }
  if (tokens.expiresIn) {
    const expiresAt = new Date().getTime() + tokens.expiresIn * 1000;
    localStorage.setItem("tokenExpiresAt", String(expiresAt));
  }
}

function getAccessToken(): string | null {
  return localStorage.getItem("accessToken");
}

function getRefreshToken(): string | null {
  return localStorage.getItem("refreshToken");
}

function clearTokens(): void {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("tokenExpiresAt");
}

function isAuthenticated(): boolean {
  return !!getAccessToken();
}

function redirectToLogin(): void {
  window.location.href = "/auth/login";
}

// ============================================================================
// EXPORTS
// ============================================================================

export const apiClient = {
  // Auth
  register,
  login,
  logout,
  getCurrentUser,
  refreshAccessToken,
  forgotPassword,
  resetPassword,

  // Billing
  createPaymentIntent,
  createSubscription,
  cancelSubscription,
  getInvoices,
  getSubscription,

  // AI
  generateText,
  getShipmentOptimization,
  analyzeSentiment,
  generateEmbedding,
  processVoiceCommand,

  // Utilities
  isAuthenticated,
  getAccessToken,
};

export default apiClient;

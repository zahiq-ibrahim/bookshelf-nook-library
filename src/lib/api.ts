import axios, { AxiosError, type AxiosInstance } from "axios";
import type { SearchResult, SavedBook, ShelfLibrary } from "./books";

/** Base URL of the Book Library API (no trailing slash). */
export const API_BASE_URL = (
  (import.meta.env.VITE_API_BASE_URL as string | undefined) || "http://localhost:3000"
).replace(/\/+$/, "");

const TOKEN_KEY = "bookLibrary.token";
const EMAIL_KEY = "bookLibrary.pendingEmail";

// ---------- token + carried email ----------
export const getToken = () =>
  typeof window === "undefined" ? null : window.localStorage.getItem(TOKEN_KEY);
export const setToken = (t: string) => window.localStorage.setItem(TOKEN_KEY, t);
export const clearToken = () => window.localStorage.removeItem(TOKEN_KEY);

export const getPendingEmail = () =>
  typeof window === "undefined" ? "" : window.sessionStorage.getItem(EMAIL_KEY) || "";
export const setPendingEmail = (e: string) => window.sessionStorage.setItem(EMAIL_KEY, e);

// ---------- clients ----------
/** Versioned client: /api/v1/* — attaches token, handles 401 on protected routes. */
export const api: AxiosInstance = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  headers: { "Content-Type": "application/json" },
  timeout: 30000,
});
/** Root client: public /library/:userId, no token. */
export const rootApi: AxiosInstance = axios.create({ baseURL: API_BASE_URL, timeout: 20000 });

api.interceptors.request.use((config) => {
  const t = getToken();
  if (t) config.headers.set("Authorization", `Bearer ${t}`);
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (error: AxiosError) => {
    const url = error.config?.url || "";
    if (error.response?.status === 401 && !url.startsWith("/auth/")) {
      clearToken();
      if (typeof window !== "undefined" && window.location.pathname !== "/login") {
        window.location.assign("/login");
      }
    }
    return Promise.reject(error);
  },
);

// ---------- error helper ----------
export interface ApiError {
  status: number | null;
  message: string;
  fieldErrors: Record<string, string>;
}

export function parseApiError(err: unknown, fallback = "Something went wrong. Please try again."): ApiError {
  if (axios.isCancel(err)) return { status: null, message: "", fieldErrors: {} };
  if (err instanceof AxiosError) {
    if (!err.response) {
      return {
        status: null,
        message:
          "Cannot reach the server. Check that the API is running and allows this site (CORS).",
        fieldErrors: {},
      };
    }
    const status = err.response.status;
    const data = err.response.data as
      | { message?: unknown; errors?: { field?: string; message?: string }[] }
      | undefined;
    const fieldErrors: Record<string, string> = {};
    if (Array.isArray(data?.errors)) {
      for (const e of data.errors) if (e?.field && e.message) fieldErrors[e.field] = e.message;
    }
    if (status === 429) {
      return { status, message: "Too many requests. Please try again in a few minutes.", fieldErrors };
    }
    let message = typeof data?.message === "string" ? data.message : "";
    if (!message && Array.isArray(data?.errors) && data.errors[0]?.message) message = data.errors[0].message;
    if (status >= 500 || !message) message = status >= 500 ? "The server had a problem. Please try again." : fallback;
    return { status, message, fieldErrors };
  }
  return { status: null, message: fallback, fieldErrors: {} };
}

// ---------- endpoints ----------
type AuthData = { user: { id: string; email: string }; token: string };

export const Api = {
  health: () => api.get("/health/hello"),

  signup: (b: { userName: string; email: string; password: string }) => api.post("/auth/signup", b),
  verifyOtp: (b: { email: string; otp: string }) =>
    api.post<{ data: AuthData }>("/auth/verify-otp", b).then((r) => r.data.data),
  resendOtp: (email: string) => api.post("/auth/resend-otp", { email }),
  login: (b: { email: string; password: string }) =>
    api.post<{ data: AuthData }>("/auth/login", b).then((r) => r.data.data),
  resetPasswordRequest: (email: string) => api.post("/auth/reset-password-request", { email }),
  resetPassword: (b: { email: string; otp: string; newPassword: string }) =>
    api.post("/auth/reset-password", b),

  me: () =>
    api
      .get<{ data: { id: string; email: string; isEmailVerified: boolean } }>("/users/me")
      .then((r) => r.data.data),

  searchByName: (bookName: string, signal?: AbortSignal) =>
    api
      .post<{ books?: SearchResult[] }>("/books/name", { bookName }, { signal })
      .then((r) => r.data.books ?? []),
  searchById: (id: string) =>
    api.post<{ books?: SearchResult[] }>("/books/id", { id }).then((r) => r.data.books?.[0] ?? null),

  addBook: (b: { bookId: string; haveRead: boolean; caption: string }) =>
    api.post<{ book: SavedBook }>("/books/add-book", b).then((r) => r.data.book),
  getLibrary: () =>
    api.post<{ library: ShelfLibrary }>("/books/get-library").then((r) => r.data.library),
  removeBook: (bookId: string) => api.delete("/books/remove-book", { data: { bookId } }),
  editLibraryCaption: (caption: string) => api.patch("/books/edit-library-caption", { caption }),
  editBook: (b: { bookId: string; caption: string; read: boolean }) => api.patch("/books/edit-book", b),
  getBook: (bookId: string) =>
    api.get(`/books/get-book/${encodeURIComponent(bookId)}`).then((r) => {
      // Response nests book inside book — unwrap defensively.
      let b = (r.data as { book?: unknown })?.book as Record<string, unknown> | undefined;
      while (b && typeof b === "object" && b.book && typeof b.book === "object" && !b._id) {
        b = b.book as Record<string, unknown>;
      }
      return b as unknown as SavedBook;
    }),
  getLibraryUrl: () => api.get<{ url: string }>("/books/get-library-url").then((r) => r.data.url),

  publicLibrary: (userId: string) =>
    rootApi
      .get<{ library: ShelfLibrary }>(`/library/${encodeURIComponent(userId)}`, {
        headers: { Accept: "application/json" },
      })
      .then((r) => {
        if (!r.data?.library) throw new Error("not found");
        return r.data.library;
      }),
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface LinkResponse {
  id: number;
  short_code: string;
  original_url: string;
  owner_id: string | null;
  custom_slug: boolean;
  created_at: string;
  expires_at: string | null;
  short_url: string;
  click_count: number;
}

export interface StatsResponse {
  short_code: string;
  original_url: string;
  total_clicks: number;
  clicks_today: number;
  created_at: string;
  expires_at: string | null;
  daily_stats: { date: string; clicks: number }[];
}

export interface CreateLinkPayload {
  url: string;
  custom_slug?: string;
  expires_at?: string;
}

class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
  }
}

async function apiFetch<T>(
  path: string,
  options: RequestInit & { token?: string } = {}
): Promise<T> {
  const { token, headers = {}, ...rest } = options;

  const response = await fetch(`${API_URL}${path}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });

  if (!response.ok) {
    let detail = `HTTP ${response.status}`;
    try {
      const body = await response.json();
      detail = body.detail || detail;
    } catch {}
    throw new ApiError(response.status, detail);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export const api = {
  createLink: (payload: CreateLinkPayload, token?: string) =>
    apiFetch<LinkResponse>("/api/links", {
      method: "POST",
      body: JSON.stringify(payload),
      token,
    }),

  listLinks: (
    token: string,
    params: { page?: number; search?: string; sort_by?: string } = {}
  ) => {
    const q = new URLSearchParams();
    if (params.page) q.set("page", String(params.page));
    if (params.search) q.set("search", params.search);
    if (params.sort_by) q.set("sort_by", params.sort_by);
    return apiFetch<LinkResponse[]>(`/api/links?${q}`, { token });
  },

  getLink: (code: string, token: string) =>
    apiFetch<LinkResponse>(`/api/links/${code}`, { token }),

  deleteLink: (code: string, token: string) =>
    apiFetch<void>(`/api/links/${code}`, { method: "DELETE", token }),

  getStats: (code: string, token: string) =>
    apiFetch<StatsResponse>(`/api/stats/${code}`, { token }),

  health: () => apiFetch<{ status: string; database: string; redis: string }>("/health"),
};

export { ApiError };

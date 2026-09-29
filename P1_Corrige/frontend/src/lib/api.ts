// Client API centralisé pour connecter le Frontend Next.js au Backend Express

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("moyo_auth_token");
}

export function setAuthToken(token: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem("moyo_auth_token", token);
  }
}

export function removeAuthToken() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("moyo_auth_token");
    localStorage.removeItem("moyo_user");
  }
}

export interface ApiResponse<T = any> {
  data: T;
  error?: string;
  message?: string;
}

export async function apiRequest<T = any>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...options.headers as Record<string, string> || {},
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });
  } catch (networkError: any) {
    // Serveur injoignable, coupure réseau, etc.
    throw new Error(
      networkError?.message
        ? `Impossible de contacter le serveur : ${networkError.message}`
        : "Impossible de contacter le serveur. Vérifiez votre connexion internet."
    );
  }

  // Le corps peut être vide (204) ou non-JSON (erreur 500 HTML, proxy, etc.)
  let raw: any = null;
  const rawText = await response.text();
  if (rawText) {
    try {
      raw = JSON.parse(rawText);
    } catch {
      raw = null;
    }
  }

  const errorMessage: string | undefined =
    raw?.error || raw?.message || (!response.ok ? `Erreur ${response.status} : ${response.statusText || "requête invalide"}` : undefined);

  // Toute réponse HTTP non-2xx est une erreur métier : on la fait remonter
  // comme une vraie exception pour que les try/catch existants la capturent réellement.
  if (!response.ok) {
    throw new Error(errorMessage || "Une erreur est survenue lors de la requête.");
  }

  const data = raw as T;

  return {
    data,
    error: errorMessage,
    message: raw?.message || undefined,
  };
}

// ==========================================
// 1. SERVICES D'AUTHENTIFICATION
// ==========================================
export const authApi = {
  register: (userData: any) => apiRequest("/auth/register", { method: "POST", body: JSON.stringify(userData) }).then(r => r.data),
  login: (credentials: { identifier: string; password: string }) => apiRequest("/auth/login", { method: "POST", body: JSON.stringify(credentials) }).then(r => r.data),
  getProfile: () => apiRequest("/auth/me", { method: "GET" }).then(r => r.data),
};

// ==========================================
// 2. SERVICES DE DISTRIBUTION & RELEASES
// ==========================================
export const releasesApi = {
  getAll: () => apiRequest("/releases", { method: "GET" }).then(r => r.data),
  getMyReleases: () => apiRequest("/releases/my-releases", { method: "GET" }).then(r => r.data),
  create: (releaseData: any) => apiRequest("/releases/create", { method: "POST", body: JSON.stringify(releaseData) }).then(r => r.data),
  distribute: (releaseId: string) => apiRequest(`/releases/${releaseId}/distribute`, { method: "POST" }).then(r => r.data),
};

// ==========================================
// 3. SERVICES 360° (YouTube OAC, TikTok, Spotify)
// ==========================================
export const servicesApi = {
  getCatalog: () => apiRequest("/services360/catalog", { method: "GET" }).then(r => r.data),
  getMyRequests: () => apiRequest("/services360/my-requests", { method: "GET" }).then(r => r.data),
  orderService: (data: any) => apiRequest("/services360/order", { method: "POST", body: JSON.stringify(data) }).then(r => r.data),
};

// ==========================================
// 4. SERVICES DE BILLETTERIE & CONCERTS
// ==========================================
export const ticketingApi = {
  getVenues: () => apiRequest("/ticketing/venues", { method: "GET" }).then(r => r.data),
  getEvents: () => apiRequest("/ticketing/events", { method: "GET" }).then(r => r.data),
  getEventDetails: (id: string) => apiRequest(`/ticketing/events/${id}`, { method: "GET" }).then(r => r.data),
  createEvent: (data: any) => apiRequest("/ticketing/events/create", { method: "POST", body: JSON.stringify(data) }).then(r => r.data),
  buyTicket: (data: { event_id: string; buyer_name: string; buyer_phone: string; ticket_type: string; payment_method: string; idempotency_key?: string }) => {
    const key = data.idempotency_key || crypto.randomUUID();
    return apiRequest("/ticketing/buy-ticket", {
      method: "POST",
      headers: { "Idempotency-Key": key },
      body: JSON.stringify({ ...data, idempotency_key: key })
    }).then(r => r.data);
  },
  scanTicket: (qrCodeHash: string) =>
    apiRequest("/ticketing/scan-ticket", { method: "POST", body: JSON.stringify({ qr_code_hash: qrCodeHash }) }).then(r => r.data),
};

// ==========================================
// 5. SERVICES MARCHÉ DE L'ART (Poto-Poto)
// ==========================================
export const marketplaceApi = {
  getArtworks: (category?: string) => apiRequest(`/marketplace/artworks${category ? `?category=${category}` : ""}`, { method: "GET" }).then(r => r.data),
  getMyArtworks: () => apiRequest("/marketplace/my-artworks", { method: "GET" }).then(r => r.data),
  createArtwork: (data: any) => apiRequest("/marketplace/artworks/create", { method: "POST", body: JSON.stringify(data) }).then(r => r.data),
  getArtworkDetails: (id: string) => apiRequest(`/marketplace/artworks/${id}`, { method: "GET" }).then(r => r.data),
  verifyCertificate: (certNumber: string) => apiRequest(`/marketplace/verify-certificate/${certNumber}`, { method: "GET" }).then(r => r.data),
};

// ==========================================
// 6. SERVICES WALLET & RETRAITS MOBILE MONEY
// ==========================================
export const walletApi = {
  getSummary: () => apiRequest("/wallet/summary", { method: "GET" }).then(r => r.data),
  withdraw: (data: { amount_fcfa: number; phone_number: string; operator: string; idempotency_key?: string }) => {
    const key = data.idempotency_key || crypto.randomUUID();
    return apiRequest("/wallet/withdraw", {
      method: "POST",
      headers: { "Idempotency-Key": key },
      body: JSON.stringify({ ...data, idempotency_key: key })
    }).then(r => r.data);
  },
};

// ==========================================
// 7. PHASE 4 : MONITORING DATA RADIOS / TV CONGO & BCDA
// ==========================================
export const monitoringApi = {
  getStations: () => apiRequest("/monitoring/stations", { method: "GET" }).then(r => r.data),
  addStation: (data: any) => apiRequest("/monitoring/stations/add", { method: "POST", body: JSON.stringify(data) }).then(r => r.data),
  testStream: (stationId: string) => apiRequest(`/monitoring/stations/${stationId}/test-stream`, { method: "POST" }).then(r => r.data),
  getLiveFeed: () => apiRequest("/monitoring/live-feed", { method: "GET" }).then(r => r.data),
  getArtistAirplay: () => apiRequest("/monitoring/artist-airplay", { method: "GET" }).then(r => r.data),
  simulateDetection: (payload?: any) => apiRequest("/monitoring/simulate-detection", { method: "POST", body: JSON.stringify(payload || {}) }).then(r => r.data),
  getBcdaReport: () => apiRequest("/monitoring/bcda-report", { method: "GET" }).then(r => r.data),
  distributeAirplayRoyalties: () => apiRequest("/monitoring/distribute-airplay-royalties", { method: "POST" }).then(r => r.data),
};

// ==========================================
// 8. INFRASTRUCTURE NATIONALE BCDA (DROITS & LICENCES)
// ==========================================
export const bcdaApi = {
  getStats: () => apiRequest("/bcda/stats", { method: "GET" }).then(r => r.data),
  getWorks: (search?: string) => apiRequest(`/bcda/works${search ? `?search=${encodeURIComponent(search)}` : ""}`, { method: "GET" }).then(r => r.data),
  inspectAudio: (data: any) => apiRequest("/bcda/works/inspect-audio", { method: "POST", body: JSON.stringify(data) }).then(r => r.data),
  registerWork: (data: any) => apiRequest("/bcda/works/register", { method: "POST", body: JSON.stringify(data) }).then(r => r.data),
  getLicenses: (search?: string) => apiRequest(`/bcda/licenses${search ? `?search=${encodeURIComponent(search)}` : ""}`, { method: "GET" }).then(r => r.data),
  payLicense: (data: any) => apiRequest("/bcda/licenses/pay", { method: "POST", body: JSON.stringify(data) }).then(r => r.data),
  renewLicense: (data: any) => apiRequest("/bcda/licenses/renew", { method: "POST", body: JSON.stringify(data) }).then(r => r.data),
  distributeRoyalties: (data: any) => apiRequest("/bcda/royalties/distribute", { method: "POST", body: JSON.stringify(data) }).then(r => r.data),
};

// ==========================================
// 9. MOYO PUBLISHING ADMINISTRATION (360° DROITS MONDIAUX)
// ==========================================
export const publishingApi = {
  getCatalog: () => apiRequest("/publishing/catalog", { method: "GET" }).then(r => r.data),
  getAnalytics: () => apiRequest("/publishing/analytics", { method: "GET" }).then(r => r.data),
  importIsrc: (data: any) => apiRequest("/publishing/import", { method: "POST", body: JSON.stringify(data) }).then(r => r.data),
  syncToWallet: () => apiRequest("/publishing/sync-to-wallet", { method: "POST" }).then(r => r.data),
};


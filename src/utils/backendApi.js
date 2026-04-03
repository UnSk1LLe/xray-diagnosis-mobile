const rawBaseUrl = process.env.EXPO_PUBLIC_BASE_URL || "http://localhost:8080";

const apiBaseUrl = rawBaseUrl.replace(/\/+$/, "");

let refreshPromise = null;

function buildUrl(path) {
  if (!path.startsWith("/")) {
    return `${apiBaseUrl}/${path}`;
  }

  return `${apiBaseUrl}${path}`;
}

async function parseResponse(response) {
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    return null;
  }

  try {
    return await response.json();
  } catch {
    return null;
  }
}

async function refreshSession() {
  if (!refreshPromise) {
    refreshPromise = fetch(buildUrl("/api/v1/auth/refresh"), {
      method: "POST",
      headers: {
        Accept: "application/json",
      },
      credentials: "include",
    })
      .then((response) => response.ok)
      .catch(() => false)
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

export async function apiRequest(path, options = {}, extra = {}) {
  const { retryOnUnauthorized = true } = extra;
  const headers = {
    Accept: "application/json",
    ...(options.headers || {}),
  };
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;

  if (options.body && !isFormData && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(buildUrl(path), {
    ...options,
    headers,
    credentials: "include",
  });
  const payload = await parseResponse(response);

  if (
    response.status === 401 &&
    retryOnUnauthorized &&
    path !== "/api/v1/auth/refresh"
  ) {
    const refreshed = await refreshSession();
    if (refreshed) {
      return apiRequest(path, options, { retryOnUnauthorized: false });
    }
  }

  if (!response.ok) {
    throw new Error(
      payload?.error || payload?.message || "Request failed. Please try again.",
    );
  }

  return payload;
}

export function normalizePhone(phone) {
  return phone.replace(/[^\d+]/g, "").trim();
}

export function asString(value) {
  if (Array.isArray(value)) {
    return value[0] || "";
  }

  return typeof value === "string" ? value : "";
}

export function mapProfile(profile) {
  return {
    id: profile?.id ?? null,
    phone: profile?.phone ?? "",
    firstName: profile?.first_name ?? "",
    lastName: profile?.last_name ?? "",
    isVerified: Boolean(profile?.is_verified),
    dateOfBirth: profile?.date_of_birth ?? "",
    gender: profile?.gender ?? "",
    address: profile?.address ?? "",
    emergencyContact: profile?.emergency_contact ?? "",
    medicalHistory: profile?.medical_history ?? "",
  };
}

export function mapReport(report) {
  return {
    id: String(report?.id ?? ""),
    imageId: report?.image_id ?? null,
    date: report?.date ?? "",
    imageUrl: report?.image_url ?? "",
    status: report?.status ?? "Processing",
    queueStatus: report?.queue_status ?? "queued",
    findings: Array.isArray(report?.findings) ? report.findings : [],
    recommendations: Array.isArray(report?.recommendations)
      ? report.recommendations
      : [],
    confidence: report?.confidence ?? 0,
    aiAnalysis: report?.ai_analysis ?? "",
    comment: report?.comment ?? "",
  };
}

export async function requestOTP(phone) {
  const response = await apiRequest("/api/v1/auth/request-otp", {
    method: "POST",
    body: JSON.stringify({ phone }),
  });
  const data = response?.data || {};

  return {
    phone: data.phone || phone,
    expiresIn: data.expires_in || 0,
    otpCode: data.otp_code || "",
  };
}

export async function verifyOTP(phone, otpCode) {
  const response = await apiRequest("/api/v1/auth/verify-otp", {
    method: "POST",
    body: JSON.stringify({
      phone,
      otp_code: otpCode,
    }),
  });
  const data = response?.data || {};
  const user = data.user || {};

  return {
    user: {
      id: user.id,
      firstName: user.first_name || "",
      lastName: user.last_name || "",
      phone: user.phone || phone,
      isVerified: Boolean(user.is_verified),
      hasCompletedProfile: Boolean(user.has_completed_profile),
    },
    session: data.session || null,
  };
}

export async function getCurrentUser() {
  const response = await apiRequest("/api/v1/auth/me", {
    method: "GET",
  });
  const user = response?.data || {};

  return {
    id: user.id,
    firstName: user.first_name || "",
    lastName: user.last_name || "",
    phone: user.phone || "",
    isVerified: Boolean(user.is_verified),
    hasCompletedProfile: Boolean(user.has_completed_profile),
  };
}

export async function logoutUser() {
  await apiRequest(
    "/api/v1/auth/logout",
    {
      method: "POST",
    },
    { retryOnUnauthorized: false },
  );
}

export async function getProfile() {
  const response = await apiRequest("/api/v1/profile", {
    method: "GET",
  });

  return mapProfile(response?.data || {});
}

export async function updateProfile(profile) {
  const response = await apiRequest("/api/v1/profile", {
    method: "PUT",
    body: JSON.stringify({
      first_name: profile.firstName,
      last_name: profile.lastName,
      date_of_birth: profile.dateOfBirth || "",
      gender: profile.gender || "",
      address: profile.address || "",
      emergency_contact: profile.emergencyContact || "",
      medical_history: profile.medicalHistory || "",
    }),
  });

  return mapProfile(response?.data || {});
}

export async function getProfileStats() {
  const response = await apiRequest("/api/v1/profile/stats", {
    method: "GET",
  });
  const stats = response?.data || {};

  return {
    totalScans: stats.total_scans || 0,
    normalResults: stats.normal_results || 0,
    abnormalResults: stats.abnormal_results || 0,
    processing: stats.processing || 0,
  };
}

export async function listReports() {
  const response = await apiRequest("/api/v1/reports", {
    method: "GET",
  });
  const reports = Array.isArray(response?.data) ? response.data : [];

  return reports.map(mapReport);
}

export async function getReport(reportID) {
  const response = await apiRequest(`/api/v1/reports/${reportID}`, {
    method: "GET",
  });

  return mapReport(response?.data || {});
}

export async function deleteReport(reportID) {
  await apiRequest(`/api/v1/reports/${reportID}`, {
    method: "DELETE",
  });
}

export async function createReport(imageAsset) {
  const formData = new FormData();
  formData.append("image", {
    uri: imageAsset.uri,
    name: imageAsset.fileName || "xray.jpg",
    type: imageAsset.mimeType || "image/jpeg",
  });
  formData.append("report_type", "chest_xray");

  const response = await apiRequest("/api/v1/reports", {
    method: "POST",
    body: formData,
  });
  const data = response?.data || {};

  return {
    reportId: data.report_id,
    imageId: data.image_id,
    imageUrl: data.image_url || "",
    queueStatus: data.queue_status || "queued",
  };
}

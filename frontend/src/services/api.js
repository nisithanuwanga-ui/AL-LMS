const viteEnvironment = import.meta.env || {};

export const API_BASE_URL = (
  viteEnvironment.VITE_API_BASE_URL || "http://localhost:5000/api"
).replace(/\/+$/, "");

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

export function getApiErrorMessage(error, t, fallback) {
  if (error instanceof ApiError) {
    if (error.status === 0) return t("api.networkError");
    const serverMessage =
      (Array.isArray(error.data?.errors) && error.data.errors.join(" ")) ||
      error.data?.message;
    if (serverMessage) return serverMessage;
    if (error.status > 0) {
      return t("api.httpError", { status: error.status });
    }
  }
  return error?.message || fallback;
}

function getErrorMessage(data, fallback) {
  if (Array.isArray(data?.errors) && data.errors.length > 0) {
    return data.errors.join(" ");
  }
  return data?.message || fallback;
}

export async function apiRequest(path, options = {}) {
  const endpoint = path.startsWith("http")
    ? path
    : `${API_BASE_URL}/${path.replace(/^\/+/, "")}`;
  const headers = new Headers(options.headers || {});
  headers.set("Accept", "application/json");
  if (options.body !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  let response;
  try {
    response = await fetch(endpoint, {
      ...options,
      headers,
      credentials: "include",
    });
  } catch (error) {
    if (error?.name === "AbortError") throw error;
    throw new ApiError("Network request failed.", 0, null);
  }

  let data = null;
  const responseText = await response.text();
  if (responseText) {
    try {
      data = JSON.parse(responseText);
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    if (
      (response.status === 401 || response.status === 403) &&
      typeof window !== "undefined"
    ) {
      const event = new Event("nisova:auth-response");
      event.statusCode = response.status;
      window.dispatchEvent(event);
    }
    throw new ApiError(
      getErrorMessage(data, `Request failed (${response.status}).`),
      response.status,
      data,
    );
  }

  return { data, status: response.status };
}

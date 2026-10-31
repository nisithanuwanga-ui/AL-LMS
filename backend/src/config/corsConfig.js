const DEFAULT_CLIENT_URL = "http://localhost:5173";

function getCorsOptions(clientUrl) {
  const origin = clientUrl || DEFAULT_CLIENT_URL;

  if (origin === "*") {
    throw new Error(
      "CLIENT_URL must be a specific origin when credentialed CORS is enabled.",
    );
  }

  return { origin, credentials: true };
}

module.exports = { getCorsOptions };

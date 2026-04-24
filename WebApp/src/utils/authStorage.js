const TOKEN_KEY = "token";

export function getAuthToken() {
  return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY) || "";
}

export function hasAuthToken() {
  return Boolean(getAuthToken());
}

export function setAuthToken(token, persist = false) {
  if (!token) {
    clearAuthToken();
    return;
  }

  if (persist) {
    localStorage.setItem(TOKEN_KEY, token);
    sessionStorage.removeItem(TOKEN_KEY);
    localStorage.setItem("rememberMe", "true");
    return;
  }

  sessionStorage.setItem(TOKEN_KEY, token);
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem("rememberMe");
}

export function clearAuthToken() {
  localStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem("rememberMe");
}

export function getRememberMePreference() {
  return localStorage.getItem("rememberMe") === "true";
}

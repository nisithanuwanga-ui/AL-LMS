export function getAuthStateAfterResponse(authState, status) {
  if (status !== 401) return authState;
  return {
    ...authState,
    user: null,
    status: "unauthenticated",
    authError: "",
  };
}

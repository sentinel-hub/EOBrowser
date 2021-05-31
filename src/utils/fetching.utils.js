export async function refetchWithDefaultToken(fetchingFunction, reqConfig) {
  try {
    return await fetchingFunction(reqConfig);
  } catch (err) {
    if (err.response && err.response.status === 429) {
      reqConfig = { ...reqConfig, authToken: null };
      return await fetchingFunction(reqConfig);
    }
    throw err;
  }
}

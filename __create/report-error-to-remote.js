// NOTE: этот файл исполняется Node (вне Metro), поэтому нельзя импортировать TS-модуль.
function safeSerializeError(error) {
  if (error == null) return { message: String(error) };
  if (typeof error === 'string') return { message: error };
  if (typeof error !== 'object') return { message: String(error) };

  const out = {};
  if (typeof error.name === 'string') out.name = error.name;
  if (typeof error.message === 'string') out.message = error.message;
  if (typeof error.stack === 'string') out.stack = error.stack;

  try {
    for (const [k, v] of Object.entries(error)) {
      if (out[k] !== undefined) continue;
      if (typeof v === 'function') continue;
      out[k] = v;
    }
  } catch {}

  if (!out.message) out.message = 'Unknown error';
  return out;
}

export const reportErrorToRemote = async ({ error }) => {
  if (
    !process.env.EXPO_PUBLIC_LOGS_ENDPOINT ||
    !process.env.EXPO_PUBLIC_PROJECT_GROUP_ID ||
    !process.env.EXPO_PUBLIC_CREATE_TEMP_API_KEY
  ) {
    console.debug(
      'reportErrorToRemote: Missing environment variables for logging endpoint, project group ID, or API key.',
      error
    );
    return { success: false };
  }
  try {
    await fetch(process.env.EXPO_PUBLIC_LOGS_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.EXPO_PUBLIC_CREATE_TEMP_API_KEY}`,
      },
      body: JSON.stringify({
        projectGroupId: process.env.EXPO_PUBLIC_PROJECT_GROUP_ID,
        logs: [
          {
            message: JSON.stringify(safeSerializeError(error)),
            timestamp: new Date().toISOString(),
            level: 'error',
            source: 'BUILDER',
            devServerId: process.env.EXPO_PUBLIC_DEV_SERVER_ID,
          },
        ],
      }),
    });
  } catch (fetchError) {
    return { success: false, error: fetchError };
  }
  return { success: true };
};

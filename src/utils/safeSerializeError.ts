export type SafeSerializedError = {
  name?: string;
  message?: string;
  stack?: string;
  [key: string]: unknown;
};

/**
 * Простая безопасная сериализация ошибки без внешних зависимостей.
 * Цель: чтобы логирование/отчёты работали и в web, и в native, и при этом не тащили ESM-only пакеты.
 */
export function safeSerializeError(error: unknown): SafeSerializedError {
  if (error == null) return { message: String(error) };

  if (typeof error === 'string') return { message: error };

  if (typeof error !== 'object') return { message: String(error) };

  const anyErr = error as Record<string, unknown>;
  const out: SafeSerializedError = {};

  if (typeof anyErr.name === 'string') out.name = anyErr.name;
  if (typeof anyErr.message === 'string') out.message = anyErr.message;
  if (typeof anyErr.stack === 'string') out.stack = anyErr.stack;

  // best-effort: add enumerable props (but skip functions)
  for (const [k, v] of Object.entries(anyErr)) {
    if (out[k] !== undefined) continue;
    if (typeof v === 'function') continue;
    out[k] = v;
  }

  if (!out.message) out.message = 'Unknown error';
  return out;
}


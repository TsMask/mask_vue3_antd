import type { BinaryResultType, ResultType } from './types';

export type ContentRange = {
  start: number;
  end: number;
  total: number;
};

const CONTENT_RANGE_PATTERN = /^bytes (\d+)-(\d+)\/(\d+)$/;

export function isBinaryResult<T = Blob>(
  result: ResultType
): result is BinaryResultType<T> {
  return (
    result.headers instanceof Headers &&
    typeof result.status === 'number' &&
    result.data !== undefined
  );
}

export function getResponseHeader(
  result: ResultType,
  name: string
): string | null {
  return isBinaryResult(result) ? result.headers.get(name) : null;
}

export function parseContentRange(result: ResultType): ContentRange | null {
  if (!isBinaryResult(result)) return null;

  const contentRange = result.headers.get('content-range') || '';
  const match = CONTENT_RANGE_PATTERN.exec(contentRange);
  if (!match) return null;

  const start = Number(match[1]);
  const end = Number(match[2]);
  const total = Number(match[3]);
  if (
    !Number.isInteger(start) ||
    !Number.isInteger(end) ||
    !Number.isInteger(total) ||
    start < 0 ||
    end < start ||
    total <= end
  ) {
    return null;
  }

  return { start, end, total };
}

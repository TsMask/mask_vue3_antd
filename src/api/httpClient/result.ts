import { RESULT_CODE_SUCCESS } from '@/constants/result';
import type { ResultType } from './types';

export function isSuccess<T>(res: ResultType<T>): boolean {
  return res.code === RESULT_CODE_SUCCESS;
}

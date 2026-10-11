import axios from 'axios';
import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';

// Turns any thrown value into a message the user can read.
export function getErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    if (err.response?.data?.message) return String(err.response.data.message);
    if (err.code === 'ECONNABORTED') return 'The server took too long to respond. Please try again.';
    if (!err.response) return 'Cannot reach the server. Check that the API is running.';
  }
  return err instanceof Error ? err.message : 'Something went wrong';
}

export const isNotFound = (err: unknown) => axios.isAxiosError(err) && err.response?.status === 404;

// Shows the API's per-field validation errors under the matching inputs.
// Returns true when at least one field error was applied.
export function applyServerErrors<T extends FieldValues>(err: unknown, setError: UseFormSetError<T>, fields: string[]): boolean {
  if (!axios.isAxiosError(err)) return false;
  const errors = err.response?.data?.errors as Record<string, string> | undefined;
  if (!errors) return false;
  let applied = false;
  for (const [field, message] of Object.entries(errors)) {
    if (fields.includes(field)) {
      setError(field as Path<T>, { type: 'server', message });
      applied = true;
    }
  }
  return applied;
}

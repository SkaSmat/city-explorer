/**
 * Retry utility for Supabase queries with exponential backoff
 *
 * This utility automatically retries failed queries with increasing delays
 * to handle transient network errors and rate limiting.
 */

interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  onRetry?: (attempt: number, error: any) => void;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffMultiplier: 2,
  onRetry: () => {},
};

/**
 * Sleep utility
 */
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Calculate delay with exponential backoff
 */
const calculateDelay = (attempt: number, options: Required<RetryOptions>): number => {
  const delay = options.initialDelay * Math.pow(options.backoffMultiplier, attempt - 1);
  return Math.min(delay, options.maxDelay);
};

/**
 * Check if error is retryable
 */
const isRetryableError = (error: any): boolean => {
  // Network errors
  if (error.message?.includes('network') || error.message?.includes('fetch')) {
    return true;
  }

  // Timeout errors
  if (error.message?.includes('timeout')) {
    return true;
  }

  // Rate limiting (429)
  if (error.status === 429 || error.code === '429') {
    return true;
  }

  // Server errors (5xx)
  if (error.status >= 500 && error.status < 600) {
    return true;
  }

  // Connection errors
  if (error.code === 'ECONNRESET' || error.code === 'ENOTFOUND') {
    return true;
  }

  return false;
};

/**
 * Retry a Supabase query with exponential backoff
 *
 * @example
 * ```typescript
 * const { data, error } = await retryQuery(
 *   () => supabaseGeo.from('users').select('*').eq('id', userId).single(),
 *   { maxRetries: 3, onRetry: (attempt, err) => console.log(`Retry ${attempt}:`, err) }
 * );
 * ```
 */
export async function retryQuery<T>(
  queryFn: () => Promise<{ data: T | null; error: any }>,
  options: RetryOptions = {}
): Promise<{ data: T | null; error: any }> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: any;

  for (let attempt = 1; attempt <= opts.maxRetries + 1; attempt++) {
    try {
      const result = await queryFn();

      // If query succeeded but returned an error, check if it's retryable
      if (result.error) {
        if (!isRetryableError(result.error)) {
          // Not retryable, return immediately
          return result;
        }

        lastError = result.error;

        // If we've exhausted retries, return the error
        if (attempt > opts.maxRetries) {
          console.warn(`Query failed after ${opts.maxRetries} retries:`, lastError);
          return result;
        }

        // Calculate delay and retry
        const delay = calculateDelay(attempt, opts);
        console.log(`Retrying query (attempt ${attempt}/${opts.maxRetries}) after ${delay}ms...`);
        opts.onRetry(attempt, result.error);
        await sleep(delay);
        continue;
      }

      // Success!
      if (attempt > 1) {
        console.log(`Query succeeded on attempt ${attempt}`);
      }
      return result;
    } catch (error) {
      lastError = error;

      // If not retryable or no more retries, throw
      if (!isRetryableError(error) || attempt > opts.maxRetries) {
        console.error(`Query failed after ${attempt} attempts:`, error);
        return { data: null, error };
      }

      // Calculate delay and retry
      const delay = calculateDelay(attempt, opts);
      console.log(`Retrying query (attempt ${attempt}/${opts.maxRetries}) after ${delay}ms...`);
      opts.onRetry(attempt, error);
      await sleep(delay);
    }
  }

  // Should never reach here, but TypeScript needs it
  return { data: null, error: lastError };
}

/**
 * Create a retry wrapper with custom default options
 *
 * @example
 * ```typescript
 * const retryWithToast = createRetryWrapper({
 *   maxRetries: 4,
 *   onRetry: (attempt) => toast.info(`Reconnexion... (${attempt}/4)`)
 * });
 *
 * const { data, error } = await retryWithToast(
 *   () => supabaseGeo.from('users').select('*')
 * );
 * ```
 */
export function createRetryWrapper(defaultOptions: RetryOptions) {
  return <T>(
    queryFn: () => Promise<{ data: T | null; error: any }>,
    options: RetryOptions = {}
  ) => {
    return retryQuery(queryFn, { ...defaultOptions, ...options });
  };
}

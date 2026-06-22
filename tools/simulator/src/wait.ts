export interface PollUntilOptions<TValue> {
  readonly timeoutMs: number;
  readonly intervalMs: number;
  readonly fetchValue: () => Promise<TValue>;
  readonly isExpected: (value: TValue) => boolean;
  readonly describeValue: (value: TValue) => string;
  readonly onTransition?: (description: string) => void;
  readonly sleep?: (milliseconds: number) => Promise<void>;
}

export class PollTimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PollTimeoutError";
  }
}

const defaultSleep = (milliseconds: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

export const pollUntil = async <TValue>(options: PollUntilOptions<TValue>): Promise<TValue> => {
  const startedAt = Date.now();
  const sleep = options.sleep ?? defaultSleep;
  let lastDescription: string | undefined;

  while (Date.now() - startedAt <= options.timeoutMs) {
    const value = await options.fetchValue();
    const description = options.describeValue(value);

    if (description !== lastDescription) {
      options.onTransition?.(description);
      lastDescription = description;
    }

    if (options.isExpected(value)) {
      return value;
    }

    await sleep(options.intervalMs);
  }

  throw new PollTimeoutError(
    `Timed out after ${options.timeoutMs}ms. Last observed value: ${lastDescription ?? "none"}.`
  );
};

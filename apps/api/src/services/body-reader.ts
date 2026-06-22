import { ApiError } from "../errors.js";

export interface ReadBoundedTextBodyInput {
  readonly request: Request;
  readonly maxBytes: number;
}

export const readBoundedTextBody = async (input: ReadBoundedTextBodyInput): Promise<string> => {
  const contentLength = input.request.headers.get("content-length");

  if (contentLength) {
    const parsedContentLength = Number(contentLength);

    if (Number.isFinite(parsedContentLength) && parsedContentLength > input.maxBytes) {
      throw new ApiError({
        code: "payload_too_large",
        statusCode: 413
      });
    }
  }

  if (!input.request.body) {
    return "";
  }

  const reader = input.request.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  try {
    for (;;) {
      const result = await reader.read();

      if (result.done) {
        break;
      }

      totalBytes += result.value.byteLength;

      if (totalBytes > input.maxBytes) {
        await reader.cancel();
        throw new ApiError({
          code: "payload_too_large",
          statusCode: 413
        });
      }

      chunks.push(result.value);
    }
  } finally {
    reader.releaseLock();
  }

  return new TextDecoder().decode(Buffer.concat(chunks));
};

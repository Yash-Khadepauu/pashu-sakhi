import sharp from "sharp";

export interface SanitizedImageResult {
  buffer: Buffer;
  mimeType: string;
  base64: string;
  metadataStripped: boolean;
}

/**
 * Strips EXIF metadata (GPS coordinates, camera serials, timestamps, device IDs)
 * from livestock photos to ensure DPDP-compliant privacy preservation before
 * the image is processed by AI services or saved to storage.
 */
export async function sanitizeLivestockImage(
  input: Buffer | string
): Promise<SanitizedImageResult> {
  let imageBuffer: Buffer;
  let inferredMimeType = "image/jpeg";

  if (typeof input === "string") {
    // Handle data URI e.g. "data:image/jpeg;base64,..."
    if (input.startsWith("data:")) {
      const match = input.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        inferredMimeType = match[1];
        imageBuffer = Buffer.from(match[2], "base64");
      } else {
        imageBuffer = Buffer.from(input, "base64");
      }
    } else {
      imageBuffer = Buffer.from(input, "base64");
    }
  } else {
    imageBuffer = input;
  }

  // Sharp automatically strips all EXIF, GPS, and vendor metadata when converting to buffer
  // unless .withMetadata() is explicitly chained.
  const imageInstance = sharp(imageBuffer);
  const metadata = await imageInstance.metadata();

  if (metadata.format === "png") {
    inferredMimeType = "image/png";
  } else if (metadata.format === "webp") {
    inferredMimeType = "image/webp";
  } else {
    inferredMimeType = "image/jpeg";
  }

  // Normalize orientation and strip all metadata
  const sanitizedBuffer = await imageInstance.rotate().toBuffer();

  return {
    buffer: sanitizedBuffer,
    mimeType: inferredMimeType,
    base64: sanitizedBuffer.toString("base64"),
    metadataStripped: true,
  };
}

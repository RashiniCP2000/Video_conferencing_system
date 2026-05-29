import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isS3Configured = Boolean(
  process.env.AWS_ACCESS_KEY_ID &&
  process.env.AWS_SECRET_ACCESS_KEY &&
  process.env.S3_BUCKET_NAME
);

if (isS3Configured) {
  console.log("[Storage] AWS S3 is fully configured. S3 upload enabled.");
} else {
  console.log("[Storage] S3 environment variables missing. Falling back to local storage mode.");
}

/**
 * Uploads a file buffer. Falls back to local storage if S3 is not configured or fails.
 * @param {Buffer} fileBuffer The file contents in memory
 * @param {string} originalName Original name of the file
 * @param {string} mimeType MIME type of the file (e.g. video/webm)
 * @returns {Promise<{ fileUrl: string, fileName: string, storageType: "s3" | "local" }>}
 */
export async function uploadFile(fileBuffer, originalName, mimeType) {
  const fileExt = path.extname(originalName) || ".webm";
  const uniqueName = `rec-${Date.now()}-${Math.random().toString(36).substring(2, 8)}${fileExt}`;

  // 1. Try S3 upload if configured
  if (isS3Configured) {
    try {
      // Dynamically import AWS SDK to avoid failure if the user hasn't run npm install for AWS SDK
      const { S3Client } = await import("@aws-sdk/client-s3");
      const { Upload } = await import("@aws-sdk/lib-storage");

      const s3Client = new S3Client({
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        },
        region: process.env.AWS_REGION || "us-east-1",
      });

      const s3Upload = new Upload({
        client: s3Client,
        params: {
          Bucket: process.env.S3_BUCKET_NAME,
          Key: `recordings/${uniqueName}`,
          Body: fileBuffer,
          ContentType: mimeType,
        },
      });

      await s3Upload.done();

      const regionString = process.env.AWS_REGION ? `s3.${process.env.AWS_REGION}.amazonaws.com` : "s3.amazonaws.com";
      const fileUrl = `https://${process.env.S3_BUCKET_NAME}.${regionString}/recordings/${uniqueName}`;

      return {
        fileUrl,
        fileName: uniqueName,
        storageType: "s3",
      };
    } catch (err) {
      console.error("[Storage] S3 Upload failed, falling back to Local Storage:", err.message);
    }
  }

  // 2. Local fallback storage
  const uploadsDir = path.join(__dirname, "..", "..", "uploads", "recordings");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const filePath = path.join(uploadsDir, uniqueName);
  fs.writeFileSync(filePath, fileBuffer);

  // Return the client-accessible download path (the client prepends the base server url)
  const fileUrl = `/uploads/recordings/${uniqueName}`;

  return {
    fileUrl,
    fileName: uniqueName,
    storageType: "local",
  };
}

/**
 * Deletes a file from either S3 or local storage.
 * @param {string} fileName Unique filename of the recording
 * @param {"s3" | "local"} storageType Storage type used for the recording
 * @returns {Promise<boolean>} True if deleted successfully
 */
export async function deleteFile(fileName, storageType) {
  if (storageType === "s3" && isS3Configured) {
    try {
      const { S3Client, DeleteObjectCommand } = await import("@aws-sdk/client-s3");
      const s3Client = new S3Client({
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        },
        region: process.env.AWS_REGION || "us-east-1",
      });

      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: process.env.S3_BUCKET_NAME,
          Key: `recordings/${fileName}`,
        })
      );
      return true;
    } catch (err) {
      console.error("[Storage] Failed to delete from S3:", err.message);
      return false;
    }
  }

  // Local fallback deletion
  try {
    const filePath = path.join(__dirname, "..", "..", "uploads", "recordings", fileName);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  } catch (err) {
    console.error("[Storage] Failed to delete local file:", err.message);
    return false;
  }
}

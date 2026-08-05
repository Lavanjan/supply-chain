import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

const globalForR2 = globalThis as unknown as {
  r2Client: S3Client | undefined;
};

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function getClient(): S3Client {
  if (globalForR2.r2Client) return globalForR2.r2Client;

  const client = new S3Client({
    region: "auto",
    endpoint: requireEnv("R2_ENDPOINT"),
    credentials: {
      accessKeyId: requireEnv("R2_ACCESS_KEY_ID"),
      secretAccessKey: requireEnv("R2_SECRET_ACCESS_KEY"),
    },
  });

  if (process.env.NODE_ENV !== "production") {
    globalForR2.r2Client = client;
  }

  return client;
}

function publicUrlBase(): string {
  return requireEnv("R2_PUBLIC_URL").replace(/\/$/, "");
}

export async function uploadToR2(params: { key: string; body: Buffer; contentType: string }): Promise<string> {
  await getClient().send(
    new PutObjectCommand({
      Bucket: requireEnv("R2_BUCKET"),
      Key: params.key,
      Body: params.body,
      ContentType: params.contentType,
    }),
  );

  return `${publicUrlBase()}/${params.key}`;
}

export async function deleteFromR2(key: string): Promise<void> {
  await getClient().send(
    new DeleteObjectCommand({
      Bucket: requireEnv("R2_BUCKET"),
      Key: key,
    }),
  );
}

/** Returns the object key if the given URL points at this app's R2 public bucket, otherwise null. */
export function extractR2Key(url: string): string | null {
  const base = process.env.R2_PUBLIC_URL?.replace(/\/$/, "");
  if (!base || !url.startsWith(`${base}/`)) return null;
  return url.slice(base.length + 1);
}

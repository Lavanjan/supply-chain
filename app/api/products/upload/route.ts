import { NextResponse, type NextRequest } from "next/server";
import { randomUUID } from "crypto";
import { auth } from "@/auth";
import { hasAnyPermission } from "@/lib/rbac/permissions";
import { uploadToR2 } from "@/lib/storage/r2";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!hasAnyPermission(session.user.permissions, ["products.create", "products.update"])) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const extension = ALLOWED_TYPES[file.type];
  if (!extension) {
    return NextResponse.json({ error: "Only JPEG, PNG, or WEBP images are allowed" }, { status: 422 });
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "Image must be smaller than 5MB" }, { status: 422 });
  }

  const key = `products/${randomUUID()}.${extension}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    const url = await uploadToR2({ key, body: buffer, contentType: file.type });
    return NextResponse.json({ url }, { status: 201 });
  } catch (error) {
    console.error("R2 upload failed:", error);
    return NextResponse.json({ error: "Unable to upload image. Please try again." }, { status: 502 });
  }
}

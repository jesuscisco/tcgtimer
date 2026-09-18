import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_TYPES = new Map<string, string>([
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/webp", ".webp"],
]);

const MAX_SIZE = 8 * 1024 * 1024; // 8 MB

export async function POST(req: Request): Promise<NextResponse> {
  try {
    const form = await req.formData();
    const file = form.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No se recibió ningún archivo." }, { status: 400 });
    }

    const mime = file.type.toLowerCase();
    if (!ALLOWED_TYPES.has(mime)) {
      return NextResponse.json(
        { error: "Formato no permitido. Usá JPG, PNG o WEBP." },
        { status: 400 }
      );
    }

    const ext = path.extname(file.name).toLowerCase();
    if (![".jpg", ".jpeg", ".png", ".webp"].includes(ext)) {
      return NextResponse.json({ error: "Extensión no permitida." }, { status: 400 });
    }

    if (file.size < 1 || file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "El archivo supera el tamaño máximo de 8 MB." },
        { status: 400 }
      );
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const name = `bg-${Date.now()}-${Math.random().toString(36).slice(2, 10)}${ALLOWED_TYPES.get(mime)}`;
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    mkdirSync(uploadsDir, { recursive: true });
    writeFileSync(path.join(uploadsDir, name), bytes);

    return NextResponse.json({ url: `/uploads/${name}` });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error subiendo el archivo." },
      { status: 500 }
    );
  }
}
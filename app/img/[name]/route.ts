import { db } from "@/lib/db";
import { ensureSchema } from "@/lib/migrate";

export const runtime = "nodejs";

// Photos and logo for the public site, kept in the site_assets table.
// They never change under the same name, so browsers and Vercel's CDN keep them.
export async function GET(_req: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  if (!/^[\w.-]{1,80}$/.test(name)) return new Response("Not found", { status: 404 });
  try {
    await ensureSchema();
    const [a] = await db()`select content_type, data from site_assets where name = ${name}`;
    if (!a) return new Response("Not found", { status: 404 });
    return new Response(new Uint8Array(a.data), {
      headers: {
        "Content-Type": a.content_type,
        "Cache-Control": "public, max-age=86400, s-maxage=31536000, stale-while-revalidate=86400",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (e) {
    console.error("site image failed", name, e);
    return new Response("Unavailable", { status: 503 });
  }
}

import { ensureSchema } from "./migrate";

export async function setupDatabase() {
  try {
    const ran = await ensureSchema();
    if (ran.length) console.log("Database set up:", ran.join(", "));
  } catch (e) {
    console.error("Database setup failed:", (e as Error).message);
  }
}

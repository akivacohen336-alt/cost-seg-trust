// Runs once when each server starts: create or upgrade the database tables.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { setupDatabase } = await import("./lib/instrumentation-node");
    await setupDatabase();
  }
}

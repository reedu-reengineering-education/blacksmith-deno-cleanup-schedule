import { load } from "https://deno.land/std@0.217.0/dotenv/mod.ts";
import { Client } from "https://deno.land/x/postgres@v0.19.2/mod.ts";
import { S3 } from "https://deno.land/x/s3@0.5.0/mod.ts";

// Load the environment variables
const env = await load();

// Create a Postgres client instance.
const databaseUrl = env["DIRECT_URL"];
const client = new Client(databaseUrl);

// Create a S3 instance
const s3 = new S3({
  accessKeyID: env["S3_UPLOAD_KEY"],
  secretKey: env["S3_UPLOAD_SECRET"],
  region: env["S3_UPLOAD_REGION"],
  endpointURL: env["S3_UPLOAD_ENDPOINT"],
});

Deno.cron("Delete temp files from S3", "30 1 * * *", async () => {
  try {
    // Get the files to delete
    await client.connect();
    const filesToDelete = await client.queryArray<[string, string, Date]>(
      `SELECT id, filename, "createdAt" FROM "File" WHERE "createdAt" < NOW() - INTERVAL '1 day';`,
    );


    // Delete the files from S3
    const bucket = s3.getBucket(env["S3_UPLOAD_BUCKET"]);
    for (const [_, filename] of filesToDelete.rows) {
      console.log(`[S3] Deleting ${filename}`);
      await bucket.deleteObject(filename);
    }

    // Delete the files from the database
    const deletedIds = await filesToDelete.rows.map(([id]) => id)
    deletedIds.forEach((id) => console.log(`[DB] Deleting ${id}`));
    await client.queryArray<[string]>(
      `DELETE FROM "File" WHERE id in ('${deletedIds.join("', '")}');`
    );

  } catch (error) {
    console.error(error);
  } finally {
    await client.end();
  }
  console.log("Done. Next run in 24 hours.")
});

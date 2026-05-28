import { spawnSync } from "node:child_process"
import { Client } from "pg"

const BASELINE_MIGRATION = "0_init"

function runCommand(command, args) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    shell: process.platform === "win32",
    env: process.env,
  })

  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}

function getDatabaseUrl() {
  return process.env.DIRECT_URL ?? process.env.DATABASE_URL
}

async function baselineIfNeeded(databaseUrl) {
  const isLocalHost =
    databaseUrl.includes("localhost") || databaseUrl.includes("127.0.0.1")

  const client = new Client({
    connectionString: databaseUrl,
    ssl: isLocalHost ? false : { rejectUnauthorized: false },
  })

  await client.connect()

  try {
    const result = await client.query(
      'select 1 from "_prisma_migrations" where migration_name = $1 limit 1',
      [BASELINE_MIGRATION],
    )

    if (result.rowCount > 0) {
      return
    }
  } catch (error) {
    if (error?.code !== "42P01") {
      throw error
    }
  } finally {
    await client.end()
  }

  runCommand("npx", ["prisma", "migrate", "resolve", "--applied", BASELINE_MIGRATION])
}

async function main() {
  const databaseUrl = getDatabaseUrl()

  if (!databaseUrl) {
    throw new Error("DIRECT_URL or DATABASE_URL must be set for vercel-build")
  }

  await baselineIfNeeded(databaseUrl)
  runCommand("npx", ["prisma", "migrate", "deploy"])
  runCommand("npx", ["next", "build"])
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})

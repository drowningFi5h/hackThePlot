import { cpSync, existsSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
const root = process.cwd();
const standalone = path.join(root, ".next", "standalone");
if (!existsSync(path.join(standalone, "server.js")))
  throw new Error("Run npm run build first.");
cpSync(path.join(root, "public"), path.join(standalone, "public"), {
  recursive: true,
});
cpSync(
  path.join(root, ".next", "static"),
  path.join(standalone, ".next", "static"),
  { recursive: true },
);
process.env.HOSTNAME = process.env.HTP_HOST || "127.0.0.1";
await import(pathToFileURL(path.join(standalone, "server.js")).href);

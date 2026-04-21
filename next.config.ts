import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

/** App root (this folder). Stops Next from treating the parent `projects/` lockfile as the repo root. */
const tracingRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  outputFileTracingRoot: tracingRoot
};

export default nextConfig;

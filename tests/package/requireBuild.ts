import { existsSync } from "node:fs";
import { join } from "node:path";

if (!existsSync(join(__dirname, "../../dist/form-builder.mjs"))) {
  throw new Error("dist/ is missing: run `pnpm test:package`, which builds first");
}

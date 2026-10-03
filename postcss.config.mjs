import { createRequire } from "node:module";
import path from "node:path";

/*
 * Workaround for project folders whose path contains "#"
 * (e.g. "F:\...\#2 Hastag & Caption Generator").
 *
 * Tailwind resolves `@import "tailwindcss"` with enhanced-resolve, which escapes
 * "#" as "\0#" and then fails to read the file. Tailwind checks
 * `globalThis.__tw_resolve` before its own resolver, so we resolve CSS imports
 * with Node's resolver there instead. It is only installed when the path really
 * contains "#", so normal folders (and Vercel builds) use Tailwind's default.
 */
if (process.cwd().includes("#")) {
  globalThis.__tw_resolve = (id, base) => {
    try {
      if (id.startsWith(".") || path.isAbsolute(id)) return path.resolve(base, id);
      const require = createRequire(path.join(base, "noop.js"));
      return require.resolve(id === "tailwindcss" ? "tailwindcss/index.css" : id);
    } catch {
      return undefined; // fall back to Tailwind's own resolver
    }
  };
}

const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;

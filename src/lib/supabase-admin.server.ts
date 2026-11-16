import { createClient } from "@supabase/supabase-js";
import type { Database } from "./supabase-database";

function createAdminClient() {
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_SECRET_KEY"] || process.env["SUPABASE_SERVICE_ROLE_KEY"];
  if (!url || !key) throw new Error("Set SUPABASE_URL and SUPABASE_SECRET_KEY on the server.");

  return createClient<Database>(url, key, {
    global: {
      fetch: (input, init) => {
        const headers = new Headers(input instanceof Request ? input.headers : undefined);
        new Headers(init?.headers).forEach((value, name) => headers.set(name, value));
        // Supabase's newer opaque secret keys are API keys, not bearer JWTs.
        if (key.startsWith("sb_secret_") && headers.get("Authorization") === `Bearer ${key}`) {
          headers.delete("Authorization");
        }
        headers.set("apikey", key);
        return fetch(input, { ...init, headers });
      },
    },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

let client: ReturnType<typeof createAdminClient> | undefined;
export const supabaseAdmin = new Proxy({} as ReturnType<typeof createAdminClient>, {
  get(_, property, receiver) {
    client ??= createAdminClient();
    return Reflect.get(client, property, receiver);
  },
});

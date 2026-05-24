/**
 * Carga variables desde .env.local (o .env) ANTES de cualquier otro import.
 * Debe importarse como primera línea de cada script:  import "./load-env";
 */
import { config } from "dotenv";
import { existsSync } from "node:fs";

const path = existsSync(".env.local") ? ".env.local" : ".env";
config({ path });

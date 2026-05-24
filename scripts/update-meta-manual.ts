import "./load-env";
import * as readline from "node:readline";
import { runUpdate } from "./update-meta";

/**
 * meta:update:manual — actualización interactiva con token temporal.
 *
 * Pide el token de Meta por consola SIN mostrarlo (input oculto), lo usa solo
 * durante la corrida y nunca lo guarda (ni en archivos, ni en logs, ni en
 * Sheets). Para entornos donde el ocultado sea inestable, usar la Forma A:
 *   META_ACCESS_TOKEN="…" npm run meta:update -- --range this_month --updatedBy Juan
 */
function promptHidden(query: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: true,
    });
    let muted = false;
    // Oculta los caracteres tecleados (no se imprime el token).
    (rl as unknown as { _writeToOutput: (s: string) => void })._writeToOutput = (
      str: string,
    ) => {
      if (!muted) process.stdout.write(str);
    };
    process.stdout.write(query);
    muted = true;
    rl.question("", (answer) => {
      muted = false;
      rl.close();
      process.stdout.write("\n");
      resolve(answer.trim());
    });
  });
}

async function main() {
  const argv = process.argv.slice(2);

  if (process.env.META_ACCESS_TOKEN) {
    // Ya viene por entorno (Forma A): no preguntar.
    await runUpdate(argv);
    return;
  }

  if (!process.stdin.isTTY) {
    console.error(
      "\n❌ Entrada no interactiva. Usa la Forma A:\n" +
        '   META_ACCESS_TOKEN="…" npm run meta:update -- ' +
        argv.join(" ") +
        "\n",
    );
    process.exit(1);
  }

  console.log("\n=== meta:update:manual ===");
  console.log("Pega el token temporal de Meta (no se mostrará ni se guardará).");
  const token = await promptHidden("Token de Meta: ");

  if (!token) {
    console.error("❌ No se ingresó token. Abortado.");
    process.exit(1);
  }

  // Vive solo en memoria de este proceso, durante la corrida.
  process.env.META_ACCESS_TOKEN = token;
  await runUpdate(argv);
}

main().catch((err) => {
  console.error("\n❌ Error fatal en meta:update:manual:", err.message ?? err);
  process.exit(1);
});

import { access, readFile } from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";

const output = path.resolve("out");
const requiredFiles = [
  "index.html",
  "404.html",
  "auth/callback/index.html",
  "invite/index.html",
  "reset-password/index.html",
  "manifest.webmanifest",
  "sw.js",
];

await Promise.all(requiredFiles.map((file) => access(path.join(output, file), constants.R_OK)));

const home = await readFile(path.join(output, "index.html"), "utf8");
if (!home.includes("/clube-da-meia-noite/_next/")) {
  throw new Error("O export não contém o basePath esperado /clube-da-meia-noite/.");
}

console.log(`Artefato estático validado em ${output}.`);

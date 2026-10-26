import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";

const basePath = "/clube-da-meia-noite";
const output = path.resolve("out");
const port = Number(process.env.PORT || 4173);
const mime = new Map([
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".ico", "image/x-icon"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".png", "image/png"],
  [".svg", "image/svg+xml"],
  [".webmanifest", "application/manifest+json"],
  [".woff2", "font/woff2"],
]);

createServer(async (request, response) => {
  try {
    const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "127.0.0.1"}`);
    if (url.pathname === basePath) {
      response.writeHead(308, { Location: `${basePath}/${url.search}` });
      response.end();
      return;
    }
    if (!url.pathname.startsWith(`${basePath}/`)) throw new Error("outside base path");
    const relative = decodeURIComponent(url.pathname.slice(basePath.length + 1));
    let file = path.resolve(output, relative || "index.html");
    if (!file.startsWith(`${output}${path.sep}`) && file !== output) throw new Error("invalid path");
    if ((await stat(file)).isDirectory()) file = path.join(file, "index.html");
    const info = await stat(file);
    response.writeHead(200, {
      "Content-Type": mime.get(path.extname(file)) ?? "application/octet-stream",
      "Content-Length": info.size,
      "Cache-Control": "no-store",
    });
    createReadStream(file).pipe(response);
  } catch {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
  }
}).listen(port, "127.0.0.1", () => {
  console.log(`Preview: http://127.0.0.1:${port}${basePath}/`);
});

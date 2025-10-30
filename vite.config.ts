// @ts-nocheck
import react from "@vitejs/plugin-react";
import { Buffer } from "node:buffer";
import process from "node:process";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    react(),
    {
      name: "save-screenshots",
      configureServer(server) {
        server.middlewares.use((req: any, res: any, next: any) => {
          if (req.method === "POST" && req.url === "/api/save-screenshots") {
            let body = "";
            req.on("data", (chunk) => {
              body += chunk;
            });
            req.on("end", () => {
              try {
                const { screenshots, description, email } = JSON.parse(
                  body || "{}"
                );
                const fs = require("fs");
                const path = require("path");
                const outDir = path.resolve(process.cwd(), "out");
                if (!fs.existsSync(outDir))
                  fs.mkdirSync(outDir, { recursive: true });

                const timestamp = Date.now();
                if (Array.isArray(screenshots)) {
                  screenshots.forEach((dataUrl, idx) => {
                    if (typeof dataUrl !== "string") return;
                    const base64 = dataUrl.replace(
                      /^data:image\/.+;base64,/,
                      ""
                    );
                    const buffer = Buffer.from(base64, "base64");
                    const filePath = path.join(
                      outDir,
                      `screenshot-${timestamp}-${idx + 1}.png`
                    );
                    fs.writeFileSync(filePath, buffer);
                  });
                }

                const metaPath = path.join(outDir, `meta-${timestamp}.json`);
                fs.writeFileSync(
                  metaPath,
                  JSON.stringify(
                    {
                      email,
                      description,
                      count: Array.isArray(screenshots)
                        ? screenshots.length
                        : 0,
                    },
                    null,
                    2
                  )
                );

                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify({ success: true }));
              } catch (e) {
                res.statusCode = 500;
                res.setHeader("Content-Type", "application/json");
                res.end(
                  JSON.stringify({ success: false, error: "Failed to save" })
                );
              }
            });
            return;
          }
          next();
        });
      },
    },
  ],
  server: {
    port: 3000,
    open: false,
  },
});

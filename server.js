import fs from "fs";
import { createServer } from "https";
import next from "next";
import path from "path";
import { fileURLToPath, parse } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

const httpsOptions = {
  key: fs.readFileSync(path.join(__dirname, "cert", "kuroneko.chat-key.pem")),
  cert: fs.readFileSync(path.join(__dirname, "cert", "kuroneko.chat-crt.pem")),
};

app.prepare().then(() => {
  createServer(httpsOptions, async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error("Error occurred handling", req.url, err);
      res.statusCode = 500;
      res.end("Internal server error");
    }
  }).listen(process.env.PORT || 443, process.env.HOST || "0.0.0.0", (err) => {
    if (err) throw err;
    console.log(
      `> Ready on https://${process.env.HOST || "localhost"}:${
        process.env.PORT || 443
      }`
    );
  });
});

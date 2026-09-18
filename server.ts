import { createServer } from "node:http";
import next from "next";

const dev = process.env.NODE_ENV !== "production";
const port = Number(process.env.PORT || 3000);

const app = next({ dev, hostname: "0.0.0.0", port });
void app.prepare().then(async () => {
  const httpServer = createServer((req, res) => {
    app.getRequestHandler()(req, res);
  });

  const { TCGServer } = await import("./src/lib/server/TCGServer");
  new TCGServer(httpServer);

  httpServer.listen(port, "0.0.0.0", () => {
    console.log(`TCG Timer ready on http://0.0.0.0:${port}`);
    if (dev) {
      console.log("  Admin  → http://localhost:3000/admin");
      console.log("  Display→ http://localhost:3000/display");
    }
  });
});
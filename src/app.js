import "dotenv/config";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import todoRoutes from "./routes/todo.routes.js";
import * as response from "./utils/api-response.js";

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.join(__dirname, "../public");

// Serve static assets with HTTP Cache-Control (1 day cache)
app.use(
  express.static(publicDir, {
    maxAge: "1d",
    etag: true,
    lastModified: true,
  })
);

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.get("/", (req, res) => {
  res.render("index", {
    title: "Todo App",
    message: "Welcome to my Todo App"
  });
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use("/api/todos", todoRoutes);

app.use((req, res) => {
  return response.error(res, "Route not found.", 404);
});

app.use((err, req, res, next) => {
  console.error(err);

  if (res.headersSent) return next(err);

  return response.error(res, "Internal server error.", 500);
});

export default app;

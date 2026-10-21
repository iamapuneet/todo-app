import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.get("/", (req, res) => {
  res.render("index", {
    title: "Todo App",
    username: "Hazrat",
    message: "Welcome to my Todo App"
  });
});

app.listen(3000, () => {
  console.log("Server running at http://localhost:3000");
});
# 03. Express 5 & Middleware Pipeline Architecture

---

## 1. Overview of `src/app.js`

`src/app.js` configures the Express application pipeline. It defines how requests are parsed, how views are rendered, how routes are mounted, how unmatched paths (404s) are handled, and how uncaught exceptions are trapped by the global error middleware.

Here is the source code of [`src/app.js`](file:///d:/node_project/todo-app/src/app.js):

```javascript
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import todoRoutes from "./routes/todo.routes.js";
import * as response from "./utils/api-response.js";

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
```

---

## 2. What is Middleware? The Conveyor Belt Analogy

In Express, a **middleware** is a function that sits between the incoming HTTP request and the final route response. It has access to the Request object (`req`), Response object (`res`), and the `next` function in the application's request-response cycle.

### Real-Life Analogy: Airport Security Checkpoint

Imagine traveling through an airport terminal to board a flight:
1. **First Gate (JSON Body Parser)**: Scans your luggage and puts it in a cart (`req.body`).
2. **Passport Control (Authentication/Validation)**: Verifies if your documentation is valid.
3. **Boarding Gate (Route Handler)**: Directs you to Flight 101 (`/api/todos`).
4. **Lost Passenger Desk (404 Handler)**: If you walk toward a gate that doesn't exist, an agent stops you and says: "No such gate" (404 Not Found).
5. **Medical Emergency Team (Global Error Handler)**: If an accident happens anywhere on the journey, emergency staff catches the passenger, prevents total airport panic, and handles the situation safely (500 Internal Server Error).

---

## 3. Deep Dive into Key Components & Keywords

### 3.1 Node.js URL & Path Handling in ESM
```javascript
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
```
- **Why this is needed**: In CommonJS (`require`), Node.js automatically provided `__dirname` and `__filename`. However, in ECMAScript Modules (`import`), these variables are not globally defined!
- `import.meta.url`: Contains the file URL of the current module (e.g., `file:///D:/node_project/todo-app/src/app.js`).
- `fileURLToPath`: Converts the URL string into an absolute OS file path (e.g., `D:\node_project\todo-app\src\app.js`).
- `path.dirname`: Extracts the containing directory (`D:\node_project\todo-app\src`).

### 3.2 View Engine Configuration
```javascript
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
```
- `app.set("view engine", "ejs")`: Informs Express to use the **EJS** template engine whenever `res.render()` is called.
- `app.set("views", ...)`: Tells Express the exact directory containing template files. Using `path.join(__dirname, "views")` guarantees OS-independent cross-platform path resolution (handling backslashes on Windows and forward slashes on Linux/macOS).

### 3.3 Body Parsing Middlewares
```javascript
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
```
- `express.json()`: Built-in middleware based on `body-parser`. It intercepts incoming requests with `Content-Type: application/json`, streams the raw byte chunks into memory, parses the JSON string, and exposes the resulting object as `req.body`.
- `express.urlencoded({ extended: true })`: Parses URL-encoded data (standard HTML `<form>` submissions). With `{ extended: true }`, it utilizes the `qs` library under the hood, allowing rich objects and arrays to be encoded into the URL-encoded format.

### 3.4 404 Route Not Found Middleware
```javascript
app.use((req, res) => {
  return response.error(res, "Route not found.", 404);
});
```
- Notice that this middleware has **no route path specified** (`app.use(...)` instead of `app.use('/path', ...)`).
- It is placed **after** all valid routes (`/`, `/api/todos`).
- If an incoming request matches no registered route, execution falls through to this middleware.
- It returns a uniform JSON response with HTTP Status `404 Not Found`.

### 3.5 Global Error Handling Middleware
```javascript
app.use((err, req, res, next) => {
  console.error(err);

  if (res.headersSent) return next(err);

  return response.error(res, "Internal server error.", 500);
});
```
- **The 4-Argument Signature**: Express identifies error-handling middleware specifically by checking `fn.length === 4` (`err, req, res, next`). If you omit `next`, Express will treat it as a standard 3-argument middleware and will never pass errors to it!
- **`if (res.headersSent) return next(err);`**:
  - **What are `headersSent`?**: A boolean property on `res` indicating whether HTTP response headers have already been transmitted to the client socket.
  - **Why this check is crucial**: In HTTP, headers can only be sent once per connection. If an error occurs halfway through streaming a response or after `res.write()` has been executed, attempting to call `res.status(500).json(...)` will throw `ERR_HTTP_HEADERS_SENT`. Delegating to `next(err)` lets Node's default handler close the socket connection safely.

---

## 4. What Makes Express 5.x Special?

In Express 4.x, if an asynchronous route handler threw an unhandled promise rejection:
```javascript
// Express 4: Crashed or hung without try/catch or next(err)
router.get("/data", async (req, res) => {
  const result = await someFailingAsyncCall();
  res.json(result);
});
```
You were required to wrap every async handler in a `try/catch` or use helper wrappers like `express-async-handler`.

**In Express 5.x**:
- Express 5 natively handles rejected Promises returned from route handlers and middleware!
- If an `async` handler throws an error or rejects, Express 5 automatically catches it and passes it directly to your 4-argument global error handler (`(err, req, res, next)`).

---

## 5. Interview Questions & Model Answers

### Q1: How does Express know a middleware is an error handler?
> **Answer**: Express inspects the function's arity (`fn.length`). Standard route middlewares accept 2 or 3 parameters (`(req, res)` or `(req, res, next)`). Error-handling middlewares must explicitly declare 4 parameters: `(err, req, res, next)`. If you do not include all 4 arguments, Express will not treat it as an error middleware.

### Q2: What happens if `express.json()` is placed AFTER `app.use("/api/todos", todoRoutes)`?
> **Answer**: Express executes middlewares strictly in top-to-bottom sequential order. If `express.json()` is placed after route handlers, incoming POST and PUT requests will reach `todoRoutes` before the body stream is parsed. As a result, `req.body` will be `undefined`, causing validation errors or crashes (e.g., `TypeError: Cannot read properties of undefined (reading 'title')`).

### Q3: Why do we need `res.headersSent` check in error handling?
> **Answer**: `res.headersSent` prevents the infamous Node.js error `ERR_HTTP_HEADERS_SENT: Cannot set headers after they are sent to the client`. If part of a response was already flushed to the client (for example during file streaming or chunked responses) and an exception occurs afterwards, we cannot send a fresh HTTP 500 status code. Checking `res.headersSent` and calling `next(err)` delegates to Express's default handler, which terminates the TCP connection and frees socket resources.

### Q4: How do you achieve CommonJS `__dirname` functionality in ES Modules (`import`)?
> **Answer**: In ES modules, `__dirname` is unavailable. We construct it using the native `node:url` and `node:path` modules:
> ```javascript
> import { fileURLToPath } from "node:url";
> import path from "node:path";
> const __filename = fileURLToPath(import.meta.url);
> const __dirname = path.dirname(__filename);
> ```
> `import.meta.url` provides the URL representation of the current file, `fileURLToPath` converts it into an operating system path, and `path.dirname` extracts the directory path.

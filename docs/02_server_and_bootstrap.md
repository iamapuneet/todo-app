# 02. Server Bootstrap & Lifecycle Management

---

## 1. Overview of `src/server.js`

`src/server.js` is the operational entry point of the application. It is responsible for booting the runtime environment, verifying critical external dependencies (the database), and binding the Node.js HTTP server to an operating system network port.

Here is the entire codebase of [`src/server.js`](file:///d:/node_project/todo-app/src/server.js):

```javascript
import "dotenv/config";
import app from "./app.js";
import db from "./config/db.js";

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    await db.query("SELECT 1");

    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Database connection failed:", err.message);
    process.exit(1);
  }
}

startServer();
```

---

## 2. Line-by-Line Code & Keyword Breakdown

### 2.1 `import "dotenv/config";`
- **What it does**: Reads the `.env` file from the root directory of the application at startup and injects key-value pairs into the global `process.env` object.
- **Why at line 1**: In ES Modules (`"type": "module"`), imports are hoisted and evaluated before any standard code runs. Importing `"dotenv/config"` as a side-effect import right at the top guarantees that all subsequent module imports (like `./config/db.js`) have access to populated environment variables.
- **Real-Life Analogy**: Turning on the master power generator before flicking any light switches in an industrial plant.

### 2.2 `const PORT = process.env.PORT || 3000;`
- **What it does**: Checks if an environment variable named `PORT` is defined. If present, it uses that value; otherwise, it falls back to default port `3000`.
- **Operator Used**: Logical OR (`||`). If the left-hand operand is falsy (`undefined`, `null`, `""`, `0`), it evaluates and returns the right-hand operand.
- **Cloud/Production Relevance**: Cloud providers (Heroku, AWS Elastic Beanstalk, Docker, Render) dynamically assign a random port via `process.env.PORT`. Hardcoding `3000` without checking `process.env.PORT` causes production deployments to crash.

### 2.3 `async function startServer() { ... }`
- **Keyword `async`**: Designates that the function returns a JavaScript `Promise` and enables the use of `await` inside its body for non-blocking asynchronous operations.
- **Why needed here**: Testing database availability requires an asynchronous network socket query. We must halt the boot sequence until that query either succeeds or fails.

### 2.4 `await db.query("SELECT 1");` (Pre-Flight Health Check)
- **What it does**: Executes a lightweight, low-overhead SQL ping query against the MySQL server before opening the web server to the public.
- **Why this is best practice (Fail-Fast)**: If MySQL is down, misconfigured, or credentials in `.env` are wrong, the server crashes immediately during launch rather than launching successfully and throwing 500 errors to real users on their first request.
- **Real-Life Analogy**: An airline pilot completing the pre-flight checklist. If the engine won't start on the runway, you cancel the flight *before* taking off into the air with passengers.

### 2.5 `app.listen(PORT, callback)`
- **What it does**: Under the hood, invokes Node's native `http.createServer(app).listen(PORT)`. It binds a TCP socket listener to the specified port and begins accepting incoming HTTP connections.
- **The Callback**: Fires only when the OS has successfully bound the port and the server is actively listening.

### 2.6 `catch (err) { process.exit(1); }`
- **`process.exit(1)`**: Terminates the Node.js process immediately with an exit code of `1` (which signifies an abnormal or error exit). An exit code of `0` signifies clean, successful completion.
- **Orchestration Tools**: Process managers like PM2, Kubernetes, and Docker inspect this exit code to automatically trigger restart policies, alerts, or container redeployments.

---

## 3. Production Enhancement: Graceful Shutdown

In a senior-level interview, you will be asked: *"What happens if your server receives a restart or termination signal while 10 users are halfway through saving their tasks?"*

In the basic implementation, if the process is killed abruptly, in-flight database transactions are severed, potentially causing data corruption.

### Graceful Shutdown Implementation Pattern

```javascript
// Capturing OS termination signals
const server = app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

const gracefulShutdown = async (signal) => {
  console.log(`Received ${signal}. Starting graceful shutdown...`);
  
  // 1. Stop accepting new incoming HTTP connections
  server.close(async () => {
    console.log("HTTP server closed.");
    
    // 2. Close database connection pool cleanly
    try {
      await db.end();
      console.log("Database connection pool closed cleanly.");
      process.exit(0);
    } catch (err) {
      console.error("Error closing database pool:", err);
      process.exit(1);
    }
  });

  // 3. Force exit if cleanup takes longer than 10 seconds (fail-safe timeout)
  setTimeout(() => {
    console.error("Forced termination due to timeout.");
    process.exit(1);
  }, 10000);
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT")); // Ctrl + C
```

---

## 4. Interview Questions & Model Answers

### Q1: What is the purpose of `await db.query("SELECT 1")` inside `startServer`?
> **Answer**: It is a pre-flight database health check. Node.js connection pools create connections lazily (only when a query is executed). Without `await db.query("SELECT 1")`, `app.listen()` would start successfully even if MySQL were completely offline or credentials were wrong. The app would then fail on the first incoming user request. Running `SELECT 1` ensures the app fails fast at boot time if the database is unreachable.

### Q2: What is the difference between `process.exit(0)` and `process.exit(1)`?
> **Answer**:
> - `process.exit(0)`: Indicates a normal, successful exit with no errors.
> - `process.exit(1)`: Indicates an unhandled error, fatal exception, or failure state. 
> Container orchestrators like Kubernetes or Docker use this status code to determine whether to restart the container (crash-loop backoff) or log a fatal alert.

### Q3: Why do we use `import "dotenv/config"` instead of `dotenv.config()`?
> **Answer**: When using ES Modules (`"type": "module"`), `import` statements are statically hoisted to the top of the file before any code executes. If you wrote:
> ```javascript
> import dotenv from "dotenv";
> import db from "./config/db.js";
> dotenv.config();
> ```
> The `db.js` module would execute *before* `dotenv.config()` runs, meaning `process.env.DB_HOST` would be undefined when creating the connection pool. Importing `"dotenv/config"` executes configuration immediately during module resolution, ensuring all environment variables are ready for subsequent imports.

### Q4: Why is `PORT` set using `process.env.PORT || 3000`?
> **Answer**: In cloud platforms (such as AWS, Render, Heroku, or Azure App Service), the host platform assigns a dynamic port number to your application via the `PORT` environment variable. Using `process.env.PORT || 3000` allows the application to adapt automatically to any assigned cloud port while defaulting cleanly to `3000` for local development.

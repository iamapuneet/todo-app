# 10. Master Interview Questions & Answers

This master guide contains 30+ high-frequency, in-depth technical interview questions directly based on this project's architecture, Node.js internals, Express 5, MySQL2, REST standards, and security best practices.

---

## 📑 Table of Contents

1. [Core Node.js & Architecture](#part-1-core-nodejs--architecture)
2. [Express 5 & Middleware Internals](#part-2-express-5--middleware-internals)
3. [Database & MySQL Engineering](#part-3-database--mysql-engineering)
4. [REST API & HTTP Design](#part-4-rest-api--http-design)
5. [Security & Defensive Coding](#part-5-security--defensive-coding)
6. [System Design & Scaling to 1M Users](#part-6-system-design--scaling-to-1m-users)

---

## Part 1: Core Node.js & Architecture

### Q1: Walk me through the architecture of this Todo application.
> **Interviewer Intent**: Assessing your grasp of layered architecture, separation of concerns, and macro-level design.
>
> **Top-Tier Answer**:
> "This application is architected using a 3-Tier Layered Pattern with strict Separation of Concerns:
> 1. **Bootstrap & Server Layer (`server.js`)**: Executes pre-flight database verification (`SELECT 1`) to fail fast before opening the network port (`app.listen()`).
> 2. **Transport & Middleware Pipeline (`app.js`)**: Manages the Express 5 pipeline, stream body parsers (`express.json()`), view engine setup, 404 fallbacks, and the global error boundary.
> 3. **Routing Layer (`todo.routes.js`)**: Maps HTTP verbs to controller actions following REST standards.
> 4. **Validation Layer (`todo.validator.js`)**: Enforces defensive contracts and string trimming before logic execution.
> 5. **Controller Layer (`todo.controller.js`)**: Orchestrates ID parsing, business rules, and wraps outputs in standardized `{ success, message, data }` envelopes.
> 6. **Data Access Layer (`todo.model.js` & `db.js`)**: Interacts with MySQL using connection pooling and server-side prepared statements to guarantee high throughput and zero SQL injection."

### Q2: Why did you separate `server.js` and `app.js`?
> **Interviewer Intent**: Checking if you know how to structure apps for automated testing and CI/CD.
>
> **Top-Tier Answer**:
> "Separating `app.js` from `server.js` decouples application configuration from network port binding:
> - `app.js` defines middleware, routing, and error handling without invoking `app.listen()`.
> - In automated integration tests (using Supertest or Jest), `app` can be imported directly into test suites. Supertest binds to ephemeral in-memory ports, preventing `EADDRINUSE` port collision errors during parallel CI/CD runs.
> - `server.js` remains the operational entrypoint, handling environment variables, database ping checks, and OS process lifecycle signals."

### Q3: What happens in the Node.js Event Loop when a database query is executed?
> **Interviewer Intent**: Testing low-level understanding of Node's non-blocking I/O model (libuv).
>
> **Top-Tier Answer**:
> "When `await db.execute()` runs:
> 1. JavaScript executes synchronously on the single V8 main thread until it reaches the query call.
> 2. Node delegates the asynchronous network socket operation to the operating system kernel via `libuv` (epoll on Linux, IOCP on Windows).
> 3. The main thread is immediately freed up to handle incoming HTTP requests or execute other JavaScript code.
> 4. When MySQL responds over the TCP socket, the OS notifies `libuv`, which queues the registered callback/Promise resolution in the Event Loop's Poll/Microtask queue.
> 5. The V8 engine resolves the Promise, resuming execution right after the `await` keyword."

---

## Part 2: Express 5 & Middleware Internals

### Q4: What makes Express 5 different from Express 4 regarding asynchronous error handling?
> **Interviewer Intent**: Verifying if you are working with cutting-edge Express 5 or stuck in older paradigms.
>
> **Top-Tier Answer**:
> "In Express 4, if an `async` route handler threw an exception or rejected a Promise, Express would not catch it automatically. Unhandled rejections would either crash the Node process or hang the client request unless wrapped in `try/catch` or utilities like `express-async-handler`.
> In Express 5, route handlers and middleware that return a Promise automatically catch rejections and pipe the error directly into the next error middleware `(err, req, res, next)` without requiring boilerplate try/catch blocks."

### Q5: Why does the global error middleware require four parameters: `(err, req, res, next)`?
> **Interviewer Intent**: Testing knowledge of JavaScript function arity and Express internals.
>
> **Top-Tier Answer**:
> "Express uses function arity (`fn.length`) to identify middleware type:
> - Normal route middleware: `fn.length === 2` or `3` (`(req, res)` or `(req, res, next)`).
> - Error-handling middleware: `fn.length === 4` (`(err, req, res, next)`).
> If you omit `next` (giving 3 arguments), Express treats it as a standard route handler and will never invoke it when an error is thrown."

### Q6: What does `res.headersSent` do and why must you check it in error handling?
> **Interviewer Intent**: Testing familiarity with HTTP socket protocols and common Node.js production crashes.
>
> **Top-Tier Answer**:
> "`res.headersSent` is a boolean flag indicating whether HTTP response headers have already been flushed to the TCP socket. In HTTP/1.1, status headers can only be sent once. If an error occurs after data streaming has begun or partial chunks were sent, attempting to call `res.status(500).json(...)` will trigger the fatal error `ERR_HTTP_HEADERS_SENT: Cannot set headers after they are sent to the client`. Checking `if (res.headersSent) return next(err);` delegates the broken connection to Express's native socket terminator, preventing process crashes."

---

## Part 3: Database & MySQL Engineering

### Q7: Why use a Connection Pool (`createPool`) instead of a single Connection (`createConnection`)?
> **Interviewer Intent**: Assessing database concurrency and production readiness.
>
> **Top-Tier Answer**:
> "A single connection (`createConnection`) handles only one query at a time over its TCP stream. If 100 concurrent requests arrive, 99 of them must wait sequentially in line, creating massive latency bottlenecks.
> Creating and destroying a connection per request is equally disastrous due to TCP 3-way handshakes and TLS/auth negotiation.
> `mysql2.createPool` maintains an active pool of pre-authenticated connections that are shared concurrently. Idle connections are borrowed, queries execute in parallel, and connections are returned to the pool, delivering high throughput."

### Q8: Explain how Prepared Statements (`db.execute`) prevent SQL Injection at the binary protocol level.
> **Interviewer Intent**: Assessing deep security knowledge beyond just 'using question marks'.
>
> **Top-Tier Answer**:
> "When `db.execute()` is called, MySQL uses its two-phase **Binary Protocol**:
> 1. **Prepare Phase**: The SQL template (`SELECT * FROM todos WHERE id = ?`) is transmitted to MySQL. The parser compiles the SQL syntax tree and creates an execution plan *before* receiving any user data.
> 2. **Execute Phase**: The variable parameters are sent in separate binary packets.
> Because the SQL grammar has already been compiled, any malicious payload (such as `1 OR 1=1; DROP TABLE todos;`) is treated strictly as raw string or integer data. It can never alter the query structure or execution plan."

### Q9: What is the purpose of the ENUM data type in the `todos` table?
> **Top-Tier Answer**:
> "The `status ENUM('pending', 'in_progress', 'completed')` column offers two major benefits:
> 1. **Storage Efficiency**: MySQL internally stores `ENUM` values as 1-byte integers (1, 2, 3) rather than storing long text strings, conserving disk space and cache memory.
> 2. **Integrity Constraint**: The storage engine rejects any value outside the permitted set at the database layer, providing defense-in-depth even if application-level validation were bypassed."

---

## Part 4: REST API & HTTP Design

### Q10: What is the architectural difference between PUT and PATCH?
> **Top-Tier Answer**:
> - **PUT (`/api/todos/:id`)**: Represents a complete resource replacement. According to REST standards, any omitted fields in a strict PUT request should either be cleared or reset to defaults.
> - **PATCH (`/api/todos/:id/status`)**: Represents a partial mutation. It updates only the specific fields supplied (e.g. toggling status), leaving all other attributes untouched."

### Q11: What is HTTP Idempotency, and which endpoints in this project are idempotent?
> **Top-Tier Answer**:
> "An HTTP method is idempotent if executing it $N$ times results in the exact same server state as executing it once:
> - **Idempotent**: 
>   - `GET /api/todos`: Fetching repeatedly does not change data.
>   - `PUT /api/todos/:id`: Updating fields to the same values repeatedly leaves the state identical.
>   - `DELETE /api/todos/:id`: Deleting ID 1 once removes it; repeating the request finds it already deleted. The end state is identical.
> - **Non-Idempotent**:
>   - `POST /api/todos`: Repeating the request creates multiple new todo records."

---

## Part 5: Security & Defensive Coding

### Q12: Walk me through your `parseId` implementation and explain why standard `parseInt` is insufficient.
> **Top-Tier Answer**:
> ```javascript
> const parseId = (value) => {
>   if (!/^[1-9]\d*$/.test(value)) return null;
>   const id = Number(value);
>   return Number.isSafeInteger(id) ? id : null;
> };
> ```
> "`parseInt` has multiple dangerous behaviors:
> 1. It silently strips non-numeric characters (`parseInt('10abc') === 10`).
> 2. It accepts negative numbers (`parseInt('-5') === -5`), which are invalid for `AUTO_INCREMENT` primary keys.
> 3. It parses octal or hexadecimal notations unpredictably.
> Our regex `/^[1-9]\d*$/` strictly enforces positive non-zero digit strings. Furthermore, `Number.isSafeInteger(id)` ensures the value does not exceed `2^53 - 1` (`Number.MAX_SAFE_INTEGER`), preventing IEEE 754 float precision loss and integer overflow exploits."

### Q13: What is Mass Assignment vulnerability and how is it prevented in `todo.model.js`?
> **Top-Tier Answer**:
> "Mass Assignment occurs when client input is passed directly into a database update query without field filtering. An attacker could tamper with columns like `id`, `created_at`, or `role`.
> In `todo.model.js`, we prevent this via strict **Field Whitelisting**:
> ```javascript
> const allowedFields = ["title", "description", "status"];
> const keys = allowedFields.filter((key) => Object.hasOwn(fields, key));
> ```
> Any unapproved keys submitted by an attacker are filtered out before dynamic SQL generation."

---

## Part 6: System Design & Scaling to 1M Users

### Q14: How would you scale this Todo application to handle 1 Million active users?
> **Interviewer Intent**: Assessing your architectural vision, database optimization, caching, and horizontal scaling capabilities.
>
> **Top-Tier Answer**:
> "To scale from hundreds of users to 1 Million active users:
> 
> 1. **Stateless Horizontal Scaling**:
>    - Run multiple Node.js instances behind an NGINX or AWS Application Load Balancer (ALB).
>    - Because our API is completely stateless (state lives in MySQL, not in Node memory), we can scale horizontally using Docker and Kubernetes.
> 
> 2. **In-Memory Caching (Redis)**:
>    - Implement Redis caching for `GET /api/todos` queries with a Cache-Aside pattern.
>    - Invalidate cache entries on POST/PUT/DELETE mutations.
> 
> 3. **Database Read/Write Splitting & Indexing**:
>    - MySQL Primary (Master) for `INSERT/UPDATE/DELETE` writes.
>    - MySQL Read Replicas (Slaves) for high-frequency `SELECT` read traffic.
>    - Add composite indexes: `CREATE INDEX idx_status_created ON todos(status, created_at DESC)`.
> 
> 4. **Connection Pool Tuning & Proxying**:
>    - Place **ProxySQL** or **AWS RDS Proxy** between Node.js and MySQL to pool thousands of application connections without overwhelming MySQL max connection limits.
> 
> 5. **Pagination**:
>    - Replace `SELECT * FROM todos` with cursor-based pagination (`WHERE id < ? ORDER BY id DESC LIMIT 20`) to prevent out-of-memory errors on large datasets."

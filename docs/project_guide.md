# Todo App — Project Architecture & Interview Guide

## 1. Project Overview

This project is a backend web application built using Node.js, Express 5, EJS, MySQL2, and dotenv.

The application can support:

- Creating new todos.
- Fetching all todos or a single todo.
- Updating todo details.
- Changing todo status.
- Deleting todos.
- Rendering dynamic HTML pages using EJS.
- Storing todo records in a MySQL database.
- Managing application configuration through environment variables.

### Technology Stack

| Technology | Purpose |
|---|---|
| Node.js | Executes JavaScript on the server. |
| Express 5 | Handles HTTP requests, routes, and middleware. |
| EJS | Generates dynamic HTML on the server. |
| MySQL | Stores application data in relational tables. |
| mysql2 | Connects Node.js to MySQL. |
| dotenv | Loads environment variables from `.env`. |

---

## 2. Project Folder Structure

Current project structure:

```text
todo-app/
├── .env
├── package.json
├── package-lock.json
├── node_modules/
└── src/
    ├── config/
    ├── controllers/
    ├── db/
    ├── models/
    ├── routes/
    ├── utils/
    ├── validators/
    ├── views/
    ├── app.js
    └── server.js
```

Note: `server.js` and some other files are recommended parts of the structure. Add them if they do not already exist.

---

## 3. Folder Responsibilities

### 3.1 `config/`

**Purpose:** Stores application configuration, such as database connection settings.

Recommended file:

```text
config/
└── db.js
```

`db.js` creates and exports the MySQL connection pool.

Example:

```javascript
import mysql from "mysql2/promise";

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

export default db;
```

Responsibilities:

- Configure the database connection.
- Manage connection pool settings.
- Export reusable configuration objects.

Avoid placing API route handlers or business logic here.

### 3.2 `controllers/`

**Purpose:** Handles incoming requests and prepares HTTP responses.

Recommended file:

```text
controllers/
└── todo.controller.js
```

Example:

```javascript
import * as Todo from "../models/todo.model.js";

export const getTodos = async (req, res) => {
  const todos = await Todo.findAll();

  return res.status(200).json({
    success: true,
    message: "Todos fetched successfully.",
    data: todos,
  });
};
```

Responsibilities:

- Read request parameters and body.
- Call validation and service/model functions.
- Select suitable HTTP status codes.
- Return JSON or render an EJS template.

Avoid writing all SQL queries and business rules directly in controllers.

### 3.3 `db/`

**Purpose:** Stores database-related resources that are not necessarily connection configuration.

Recommended structure:

```text
db/
├── schema.sql
└── migrations/
```

`schema.sql` can contain table definitions.

Example:

```sql
CREATE TABLE todos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status ENUM(
        'pending',
        'in_progress',
        'completed'
    ) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

Responsibilities:

- Define database tables.
- Store SQL schema scripts.
- Maintain database migration files.
- Document indexes and constraints.

The actual database records live in MySQL, not in this folder.

### 3.4 `models/`

**Purpose:** Handles database queries and data access.

Recommended file:

```text
models/
└── todo.model.js
```

Example:

```javascript
import db from "../config/db.js";

export const findAll = async () => {
  const [rows] = await db.execute(
    "SELECT * FROM todos ORDER BY id DESC"
  );

  return rows;
};

export const findById = async (id) => {
  const [rows] = await db.execute(
    "SELECT * FROM todos WHERE id = ?",
    [id]
  );

  return rows[0] ?? null;
};
```

Responsibilities:

- Insert database records.
- Fetch records.
- Update records.
- Delete records.
- Execute parameterized SQL queries.

Avoid sending HTTP responses from models.

### 3.5 `routes/`

**Purpose:** Maps HTTP methods and URL paths to controller functions.

Recommended file:

```text
routes/
└── todo.routes.js
```

Example:

```javascript
import { Router } from "express";
import {
  getTodos,
  getTodoById,
} from "../controllers/todo.controller.js";

const router = Router();

router.get("/", getTodos);
router.get("/:id", getTodoById);

export default router;
```

Responsibilities:

- Define API endpoints.
- Connect routes to controllers.
- Attach route-specific middleware.
- Keep URL definitions separate from controller logic.

Example endpoints:

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/todos` | Create a todo |
| GET | `/api/todos` | Fetch all todos |
| GET | `/api/todos/:id` | Fetch one todo |
| PUT | `/api/todos/:id` | Update todo details |
| PATCH | `/api/todos/:id/status` | Update status |
| DELETE | `/api/todos/:id` | Delete a todo |

These endpoints must be implemented in the route and controller files to become functional.

### 3.6 `utils/`

**Purpose:** Contains reusable helper functions that are not tied to one specific business feature.

Recommended file:

```text
utils/
└── api-response.js
```

Example:

```javascript
export const success = (
  res,
  message,
  data,
  statusCode = 200
) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

export const error = (
  res,
  message,
  statusCode = 400
) => {
  return res.status(statusCode).json({
    success: false,
    message,
  });
};
```

Responsibilities:

- Standardize API responses.
- Provide reusable formatting helpers.
- Handle common utility operations.

Do not use this folder as a place for every function that does not fit elsewhere.

### 3.7 `validators/`

**Purpose:** Validates incoming request data before processing it.

Recommended file:

```text
validators/
└── todo.validator.js
```

Example:

```javascript
export const validateCreateTodo = (body) => {
  if (
    typeof body.title !== "string" ||
    !body.title.trim()
  ) {
    return "Title is required.";
  }

  if (body.title.trim().length > 255) {
    return "Title cannot exceed 255 characters.";
  }

  return null;
};
```

Responsibilities:

- Check required fields.
- Validate data types.
- Check permitted status values.
- Enforce input length limits.
- Reject malformed requests.

Validation should happen before inserting or updating database records. Database constraints remain important as an additional layer of protection.

### 3.8 `views/`

**Purpose:** Contains server-rendered HTML templates.

Recommended structure:

```text
views/
├── index.ejs
├── todos/
│   ├── list.ejs
│   └── detail.ejs
└── partials/
    ├── header.ejs
    └── footer.ejs
```

Example:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title><%= title %></title>
</head>
<body>
  <h1><%= message %></h1>
  <p>Username: <%= username %></p>
</body>
</html>
```

Responsibilities:

- Display dynamic server-side data.
- Render todo lists.
- Display error or success messages.
- Reuse common HTML fragments.

EJS generates HTML on the server. Browser-side interactions, such as button clicks and theme toggles, still use client-side JavaScript.

### 3.9 `app.js`

**Purpose:** Configures the Express application.

Responsibilities:

- Create the Express app.
- Register middleware.
- Configure EJS.
- Register routes.
- Add 404 handling.
- Register error-handling middleware.
- Export the configured app.

Example:

```javascript
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import todoRoutes from "./routes/todo.routes.js";

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use("/api/todos", todoRoutes);

app.get("/", (req, res) => {
  res.render("index", {
    title: "Todo App",
    username: "Hazrat",
    message: "Welcome to my Todo App",
  });
});

export default app;
```

The example assumes that the corresponding routes and EJS template exist.

### 3.10 `server.js`

**Purpose:** Starts the HTTP server and performs startup tasks.

Recommended file:

```javascript
import "dotenv/config";
import app from "./app.js";
import db from "./config/db.js";

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    await db.query("SELECT 1");

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Startup failed:", error.message);
    process.exit(1);
  }
}

startServer();
```

Responsibilities:

- Load environment variables before app initialization.
- Check database connectivity.
- Start the server.
- Handle startup failures.

Keep `app.js` focused on Express configuration and `server.js` focused on starting the application.

---

## 4. How a Request Travels Through the Project

Example: A client requests `GET /api/todos`.

```text
Client / Postman
       |
       v
    server.js
       |
       v
      app.js
       |
       v
 routes/todo.routes.js
       |
       v
controllers/todo.controller.js
       |
       v
 models/todo.model.js
       |
       v
  config/db.js
       |
       v
  MySQL Database
       |
       v
   Model Results
       |
       v
   Controller
       |
       v
  JSON Response
```

Additional responsibilities:

- `validators/` checks incoming data before mutations.
- `utils/` provides reusable response helpers.
- `db/` stores SQL schema and migration resources.
- `views/` generates HTML when the application renders a page.
- `.env` supplies configuration through dotenv.

Not every request passes through every folder. For example, a static informational route may not access the database at all.

---

## 5. Important Architecture Concepts

### Separation of Concerns

Each part of the application has a distinct responsibility.

For example, a controller should not need to know the details of how a MySQL connection pool is configured.

### Reusability

Shared response helpers and validation functions reduce duplication.

### Maintainability

When database queries, routing, and HTTP responses are separated, individual components are easier to understand and test.

### Security

- Use parameterized SQL queries.
- Validate incoming data.
- Keep secrets out of source control.
- Avoid exposing internal error details to clients.
- Apply authentication and authorization when private data or protected operations require them.

### Error Handling

Express 5 automatically forwards rejected promises from async route handlers and middleware to error-handling middleware. Errors in other asynchronous callbacks may require explicit forwarding.

---

# 6. Interview Questions and Answers

## Beginner-Level Questions

### Q1. What is Node.js?

**Answer:** Node.js is a JavaScript runtime that allows JavaScript to execute outside a browser, including on a server.

### Q2. What is Express.js?

**Answer:** Express is a Node.js web framework used to handle HTTP requests, define routes, apply middleware, and send responses.

### Q3. What is the difference between `app.js` and `server.js`?

**Answer:** `app.js` configures the Express application. `server.js` starts the HTTP server and can perform startup checks.

### Q4. What is middleware in Express?

**Answer:** Middleware is a function that can inspect or modify a request, modify a response, end the request-response cycle, or pass control to the next middleware.

Example:

```javascript
app.use(express.json());
```

This middleware parses incoming JSON request bodies.

### Q5. What is EJS?

**Answer:** EJS is a server-side template engine that combines data with HTML templates to generate dynamic HTML.

### Q6. What is the purpose of dotenv?

**Answer:** dotenv loads configuration values from a `.env` file into `process.env`.

### Q7. What is MySQL2?

**Answer:** MySQL2 is a Node.js driver that enables applications to connect to MySQL and execute SQL queries.

### Q8. What is the difference between `res.sendFile()` and `res.render()`?

**Answer:** `res.sendFile()` sends an existing file. `res.render()` renders a template with data and sends the resulting HTML.

### Q9. What is the difference between `GET` and `POST`?

**Answer:** `GET` is generally used to retrieve resources. `POST` is generally used to submit data or create a resource.

### Q10. What is CRUD?

**Answer:** CRUD stands for Create, Read, Update, and Delete, the four basic operations used to manage data.

---

## Intermediate-Level Questions

### Q11. What is the difference between a route and a controller?

**Answer:** A route maps an HTTP method and URL to a handler. A controller implements the request-handling logic and returns the response.

### Q12. What is the purpose of a model?

**Answer:** In this project, the model handles database queries and data access, such as retrieving or updating todo records.

### Q13. Why should SQL queries use placeholders?

**Answer:** Parameterized queries separate SQL instructions from user-supplied values and help prevent SQL injection.

Example:

```javascript
await db.execute(
  "SELECT * FROM todos WHERE id = ?",
  [id]
);
```

### Q14. Why use `async/await` with MySQL2?

**Answer:** Database operations are asynchronous. `async/await` makes their control flow easier to read and allows errors to be handled with `try/catch` when needed.

### Q15. What is connection pooling?

**Answer:** Connection pooling reuses a managed collection of database connections instead of opening a new connection for every query.

### Q16. What is the difference between `PUT` and `PATCH`?

**Answer:** `PUT` conventionally replaces a resource representation, while `PATCH` applies a partial update. The exact behavior depends on the API implementation.

### Q17. What is the purpose of a validator?

**Answer:** A validator checks whether incoming data meets expected rules before the application performs operations such as database insertion or updating.

### Q18. Why should controllers not contain all database queries?

**Answer:** Separating database access improves organization, reuse, testability, and maintainability.

### Q19. What is HTTP status code 404?

**Answer:** `404 Not Found` indicates that the requested resource or route could not be found.

### Q20. What is HTTP status code 500?

**Answer:** `500 Internal Server Error` indicates that the server encountered an unexpected condition that prevented it from completing the request.

---

## Advanced-Level Questions

### Q21. What is separation of concerns?

**Answer:** It is a design principle in which different modules handle different responsibilities, such as routing, validation, business logic, and database access.

### Q22. What happens if an async Express 5 route throws an error?

**Answer:** Express 5 forwards a rejected promise or thrown error from an async route handler to the error-handling middleware.

### Q23. How can you protect a Todo API?

**Answer:** Use appropriate authentication, authorization, validation, parameterized SQL, rate limiting, secure configuration, and careful error handling.

### Q24. What is the difference between authentication and authorization?

**Answer:** Authentication verifies who a user is. Authorization determines what that user is permitted to do.

### Q25. Why should `.env` not be committed to Git?

**Answer:** It may contain passwords, API keys, and other secrets. Exposing them can compromise application and database security.

### Q26. How would you improve this project for production?

**Answer:** Add automated tests, structured logging, request validation, authentication where required, database migrations, pagination, rate limiting, monitoring, and deployment-specific configuration.

### Q27. What is the difference between a database driver and an ORM?

**Answer:** A database driver such as MySQL2 provides low-level database connectivity and query execution. An ORM provides a higher-level interface for mapping application objects to database records.

### Q28. How would you implement pagination?

**Answer:** Accept validated page and page-size parameters, calculate an offset, and retrieve a limited number of records. Apply maximum page-size limits and use deterministic ordering.

### Q29. Why is centralized error handling useful?

**Answer:** It keeps error responses consistent, reduces duplicated handling code, and provides a central location for logging unexpected failures.

### Q30. How would you test the Todo API?

**Answer:** Test successful operations, invalid input, missing records, database failures, correct HTTP status codes, and response formats using unit and integration tests.

---

## 7. Practical Interview Tasks

Practice implementing these features without copying existing code:

1. Create a todo using `POST`.
2. Fetch all todos using `GET`.
3. Fetch a todo by ID.
4. Validate required fields.
5. Update a todo using `PUT`.
6. Change status using `PATCH`.
7. Delete a todo using `DELETE`.
8. Render a todo list using EJS.
9. Add pagination to the list endpoint.
10. Add consistent error handling.
11. Explain the complete request flow from Express route to MySQL and back.
12. Explain why configuration, validation, database access, and HTTP handling belong in separate modules.

## 8. Final Summary

The main purpose of this architecture is to make the Todo application organized and easier to extend.

- `config/` — application configuration and database connection.
- `controllers/` — request handling and responses.
- `db/` — schema and migrations.
- `models/` — database operations.
- `routes/` — endpoint definitions.
- `utils/` — reusable helper functions.
- `validators/` — input validation.
- `views/` — EJS templates.
- `app.js` — Express application configuration.
- `server.js` — application startup.

Understanding the purpose of each module and being able to explain the request flow is more important in an interview than simply memorizing folder names.

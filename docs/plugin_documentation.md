# Node.js Todo App — Dependency Documentation

## 1. Project Overview

This project uses Node.js with Express, EJS, MySQL2, and dotenv to build a server-side web application and REST APIs.

Each dependency has a specific responsibility:

- **Express:** Handles HTTP requests, routes, middleware, and responses.
- **EJS:** Generates dynamic HTML using server-side data.
- **MySQL2:** Connects the application to a MySQL database.
- **dotenv:** Loads configuration and secrets from environment variables.

These packages work together to build a backend that can receive requests, process data, interact with a database, and return HTML or JSON responses.

---

## 2. dotenv

### Overview

`dotenv` is a configuration package that loads variables from a `.env` file into `process.env`.

It helps separate application configuration from source code.

### What can we achieve?

- Store database connection settings outside source files.
- Configure the application port.
- Switch configuration between development and production.
- Avoid hardcoding credentials in application code.
- Maintain different environment settings on different machines.

### How does it work?

1. Create a `.env` file in the project root.
2. Define configuration variables.
3. Load dotenv before accessing those variables.
4. Read the values using `process.env`.

### Example

**.env**

```env
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=todo_app
```

**src/server.js**

```javascript
import "dotenv/config";

const port = process.env.PORT || 3000;

console.log(`Application port: ${port}`);
```

### Limitations

- dotenv does not encrypt or automatically secure secrets.
- Variables are generally strings and may require conversion.
- It does not validate whether required variables exist.
- It does not automatically create separate environment configurations.
- It does not replace a production secrets manager.

**Best practice:** Add `.env` to `.gitignore`, and provide a `.env.example` file containing placeholder values.

---

## 3. Express

### Overview

Express is a web framework for Node.js. It simplifies the process of building web servers and HTTP APIs.

Node.js provides the runtime; Express provides a convenient structure for handling web requests.

### What can we achieve?

- Build REST APIs.
- Handle GET, POST, PUT, PATCH, and DELETE requests.
- Create route-specific controllers.
- Parse JSON request bodies.
- Add authentication and authorization middleware.
- Serve static files and render HTML templates.
- Implement centralized error handling.
- Connect routes to business logic and database operations.

### How does it work?

A typical Express request follows this flow:

1. The client sends an HTTP request.
2. Express receives the request.
3. Middleware processes the request.
4. A matching route invokes its handler.
5. The application performs business logic or database operations.
6. Express sends an HTTP response.

### Example

```javascript
import express from "express";

const app = express();

app.use(express.json());

app.get("/api/hello", (req, res) => {
  res.json({
    success: true,
    message: "Hello from Express"
  });
});

app.post("/api/todos", (req, res) => {
  const { title } = req.body;

  res.status(201).json({
    success: true,
    message: "Todo received",
    data: { title }
  });
});

app.listen(3000);
```

### Limitations

- Express does not provide a built-in database or ORM.
- Authentication and authorization must be implemented or added through suitable libraries.
- Input validation is not automatic.
- Business logic and project architecture must be designed by the developer.
- Security features such as rate limiting and secure headers require additional configuration or packages.
- Error handling and logging require deliberate implementation.

**Best practice:** Keep routes, controllers, services, models, validators, and configuration separate as the application grows.

---

## 4. EJS

### Overview

EJS (Embedded JavaScript templates) is a server-side templating engine. It allows JavaScript data to be inserted into HTML before the server sends the page to the browser.

It is useful when a server needs to generate HTML dynamically.

### What can we achieve?

- Display a user's name or profile information.
- Render database records into HTML.
- Generate dynamic dashboards.
- Display todo lists and task statuses.
- Use conditional statements to show different content.
- Loop through arrays to generate repeated HTML elements.
- Reuse common layouts and partial templates.

### How does it work?

1. Express receives a request.
2. The controller obtains the required data.
3. `res.render()` passes data to an EJS template.
4. EJS evaluates template expressions on the server.
5. The generated HTML is sent to the browser.

### Example

**Controller**

```javascript
app.get("/", (req, res) => {
  res.render("index", {
    title: "Todo App",
    username: "Hazrat",
    message: "Welcome to my Todo App"
  });
});
```

**views/index.ejs**

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

### Important EJS Syntax

| Syntax | Purpose |
|---|---|
| `<%= value %>` | Outputs a value with HTML escaping. |
| `<%- value %>` | Outputs unescaped content; unsafe for untrusted HTML. |
| `<% code %>` | Executes JavaScript without directly outputting its result. |
| `<% if (...) { %>` | Adds conditional template logic. |
| `<% items.forEach(...) %>` | Loops through a collection. |

### Limitations

- EJS does not replace Express or Node.js.
- It does not provide a database or API by itself.
- It does not automatically create a modern frontend application.
- Browser-side interactions still require JavaScript.
- Large templates with too much business logic become difficult to maintain.
- Unescaped output can introduce cross-site scripting (XSS) vulnerabilities.

**Best practice:** Use `<%=` for ordinary user-provided text and avoid `<%-` with untrusted input.

---

## 5. MySQL2

### Overview

`mysql2` is a Node.js driver for connecting to MySQL databases.

It allows the application to execute SQL queries, insert records, retrieve data, update records, and delete records. It also supports promises and connection pooling.

### What can we achieve?

- Connect Node.js applications to MySQL.
- Perform CRUD operations.
- Store users, todos, products, and other structured data.
- Execute parameterized SQL queries.
- Use asynchronous database operations with `async/await`.
- Reuse database connections through a connection pool.
- Execute transactions for operations that must succeed or fail together.

### How does it work?

1. The application creates a database connection or connection pool.
2. A model or repository executes a SQL query.
3. MySQL processes the query.
4. The driver returns the result to Node.js.
5. The application uses the result to build an API response or HTML page.

### Example

**Database connection**

```javascript
import mysql from "mysql2/promise";

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10
});

export default db;
```

**Fetch todos**

```javascript
import db from "../config/db.js";

export const findAll = async () => {
  const [rows] = await db.execute(
    "SELECT * FROM todos ORDER BY id DESC"
  );

  return rows;
};
```

**Insert a todo**

```javascript
const [result] = await db.execute(
  "INSERT INTO todos (title) VALUES (?)",
  ["Learn Node.js"]
);
```

### Limitations

- MySQL2 is a database driver, not a database server.
- MySQL must be installed or available through a database service.
- It does not automatically design tables or create migrations.
- It does not provide a full ORM or automatically manage application models.
- Incorrect SQL or inefficient queries can affect performance.
- Connections, transactions, and errors must be handled properly.
- Database constraints and validation still need to be designed.

**Best practice:** Use parameterized queries, limit database privileges, configure connection pools, and keep SQL operations in a dedicated model or repository layer.

---

## 6. How All Dependencies Work Together

The following example shows a typical request flow for a Todo application.

```text
Client / Browser / Postman
            |
            v
       Express Server
            |
            v
    Route and Controller
            |
            v
      Business Logic
            |
            v
      MySQL2 Driver
            |
            v
       MySQL Database
            |
            v
       Query Results
            |
       +----+----+
       |         |
       v         v
   JSON API    EJS HTML
       |         |
       +----+----+
            |
            v
      Client Response
```

`dotenv` supplies the configuration needed by the server and database connection. It is not a request-processing step; it loads configuration during application startup.

---

## 7. Dependency Comparison

| Capability | dotenv | Express | EJS | MySQL2 |
|---|---|---|---|---|
| Configuration loading | Yes | No | No | No |
| HTTP routing | No | Yes | No | No |
| REST API creation | No | Yes | No | No |
| Dynamic HTML generation | No | Supports integration | Yes | No |
| Database queries | No | No | No | Yes |
| Database storage | No | No | No | Connects to MySQL |
| Request validation | No | Custom or middleware | No | No |
| Authentication | No | Requires implementation or libraries | No | No |

---

## 8. What These Dependencies Do Not Provide

These four dependencies form a useful foundation, but they do not provide every feature a production application may need.

Depending on the application, additional tools or implementation may be required for:

- **Authentication:** Login, sessions, password hashing, or JWT.
- **Validation:** Request body, query parameter, and route parameter validation.
- **Security:** Rate limiting, secure HTTP headers, and access control.
- **Database migrations:** Version-controlled schema changes.
- **Testing:** Unit tests and integration tests.
- **Logging:** Structured logs and error monitoring.
- **API documentation:** OpenAPI or Swagger.
- **File uploads:** Upload processing and storage.
- **Deployment:** Hosting, environment configuration, and process management.

These are additional concerns, not necessarily additional dependencies required for every project.

---

## 9. Recommended Project Structure

```text
todo-app/
├── .env
├── .env.example
├── .gitignore
├── package.json
└── src/
    ├── config/
    │   └── db.js
    ├── controllers/
    │   └── todo.controller.js
    ├── models/
    │   └── todo.model.js
    ├── routes/
    │   └── todo.routes.js
    ├── services/
    │   └── todo.service.js
    ├── validators/
    │   └── todo.validator.js
    ├── utils/
    │   └── api-response.js
    ├── views/
    │   └── index.ejs
    ├── app.js
    └── server.js
```

This structure separates HTTP handling, business logic, database access, validation, templates, and configuration.

---

## 10. Conclusion

These dependencies serve different but complementary purposes:

- `dotenv` manages environment configuration.
- `express` manages HTTP requests and responses.
- `ejs` generates dynamic server-rendered HTML.
- `mysql2` communicates with the MySQL database.

Together, they allow developers to build database-backed web applications and REST APIs. The quality, security, performance, and maintainability of the final application still depend on the architecture, validation, error handling, database design, and deployment practices implemented by the developer.

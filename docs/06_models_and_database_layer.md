# 06. Models & Database Layer Architecture

---

## 1. Overview of the Database Architecture

The data access layer consists of three key components:
1. **[`src/db/schema.sql`](file:///d:/node_project/todo-app/src/db/schema.sql)**: Defines database creation, table structure, indexes, and constraints.
2. **[`src/config/db.js`](file:///d:/node_project/todo-app/src/config/db.js)**: Configures the `mysql2/promise` connection pool.
3. **[`src/models/todo.model.js`](file:///d:/node_project/todo-app/src/models/todo.model.js)**: Executes SQL statements, dynamic updates, and parameter bindings.

---

## 2. Database Schema Analysis (`src/db/schema.sql`)

```sql
CREATE DATABASE IF NOT EXISTS todo_app;

USE todo_app;

CREATE TABLE IF NOT EXISTS todos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NULL,
    status ENUM(
        'pending',
        'in_progress',
        'completed'
    ) NOT NULL DEFAULT 'pending',
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL
);
```

### Key Column Decisions:
- **`id INT AUTO_INCREMENT PRIMARY KEY`**: 4-byte integer (up to ~2.14 billion rows). The Primary Key automatically creates a clustered B-Tree index, ensuring O(log N) lookups by ID.
- **`title VARCHAR(255) NOT NULL`**: Variable-length character string up to 255 characters. `NOT NULL` enforces data integrity at the storage engine level.
- **`description TEXT NULL`**: Stores long-form text (up to 64 KB). Nullable because descriptions are optional.
- **`status ENUM(...)`**: An enumeration physically stored internally as a 1-byte integer (1 = 'pending', 2 = 'in_progress', 3 = 'completed'), saving storage space and enforcing valid state transitions.
- **`created_at` & `updated_at`**: Precise timestamps recorded via MySQL's `NOW()`.

---

## 3. Connection Pooling (`src/config/db.js`)

```javascript
import mysql from "mysql2/promise";

const env = process.env;

const db = mysql.createPool({
  host: env.DB_HOST,
  port: Number(env.DB_PORT || 3306),
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
  waitForConnections: true,
});

export default db;
```

### Real-Life Analogy: Car Rental Agency vs Buying a Car

- **Without a Pool (`createConnection`)**: Every time a customer (HTTP request) wants to visit a store, you go to a car showroom, buy a brand-new car, pay the registration fees (TCP 3-way handshake + MySQL authentication), drive it for 5 minutes, and then crush the car at the scrapyard (`conn.end()`). This destroys server performance and exhausts ports.
- **With a Pool (`createPool`)**: A car rental agency maintains a fleet of 10 ready-to-drive cars. When an HTTP request arrives, it borrows an idle car from the parking lot, completes the query instantly, washes the car, and parks it back in the pool for the next request.

### Pool Configuration Attributes:
- **`waitForConnections: true`**: When all pool connections are busy and a new query arrives, the pool queues the query until a connection is released, rather than throwing an immediate error.
- **`mysql2/promise`**: Wraps native callbacks in native JavaScript Promises, unlocking modern `async/await` syntax.

---

## 4. Model Functions Walkthrough (`src/models/todo.model.js`)

```javascript
import db from "../config/db.js";

export const create = async ({ title, description, status }) => {
  const [result] = await db.execute(
    `INSERT INTO todos
      (title, description, status, created_at, updated_at)
     VALUES (?, ?, ?, NOW(), NOW())`,
    [title, description ?? null, status ?? "pending"]
  );

  return findById(result.insertId);
};

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

export const update = async (id, fields) => {
  const allowedFields = ["title", "description", "status"];
  const keys = allowedFields.filter((key) =>
    Object.hasOwn(fields, key)
  );

  if (keys.length === 0) return findById(id);

  const setClause = keys
    .map((key) => `\`${key}\` = ?`)
    .join(", ");

  const values = keys.map((key) => fields[key]);

  await db.execute(
    `UPDATE todos SET ${setClause} WHERE id = ?`,
    [...values, id]
  );

  return findById(id);
};

export const remove = async (id) => {
  const [result] = await db.execute(
    "DELETE FROM todos WHERE id = ?",
    [id]
  );

  return result.affectedRows > 0;
};
```

---

## 5. Security & Architectural Highlights

### 5.1 `db.execute()` vs `db.query()` (Prepared Statements)
- **`db.query()`**: Sends the entire SQL query string as raw text over the network.
- **`db.execute()`**: Uses MySQL's **Binary Protocol Prepared Statements**:
  1. **Prepare Phase**: The SQL statement template (`INSERT INTO todos ... VALUES (?, ?, ?)`) is compiled and parsed by the MySQL query optimizer ahead of time.
  2. **Execute Phase**: Data values are transmitted in separate binary packets.
  - **Why this eliminates SQL Injection 100%**: Even if an attacker passes `' OR '1'='1` in the `title` parameter, the MySQL parser has already determined the syntax tree. The attacker's payload is treated purely as inert text data, never as executable SQL commands!

### 5.2 Dynamic SQL Building with Whitelisting
In `update(id, fields)`:
```javascript
const allowedFields = ["title", "description", "status"];
const keys = allowedFields.filter((key) => Object.hasOwn(fields, key));
```
- **Why Whitelisting is critical**: If an attacker sends `{ "id": 999, "created_at": "2000-01-01" }`, the filter ignores those keys because they are not in `allowedFields`.
- **`Object.hasOwn(fields, key)`**: Modern ECMAScript 2022 method that safely checks if an object possesses a direct property without walking the prototype chain. It is immune to prototype poisoning attacks where an attacker submits `{ "__proto__": ... }`.

### 5.3 Array Spreading in Prepared Parameters
```javascript
await db.execute(
  `UPDATE todos SET ${setClause} WHERE id = ?`,
  [...values, id]
);
```
- The spread operator `...values` flattens the array of field values, appending the target `id` at the very end to match the final `?` in `WHERE id = ?`.

---

## 6. Interview Questions & Model Answers

### Q1: What is the difference between `createPool` and `createConnection` in `mysql2`?
> **Answer**: `createConnection` opens a single, dedicated TCP connection to the MySQL server. In a web server handling concurrent requests, queries would either have to wait in line sequentially or multiple connections would need to be opened and closed per request, creating heavy overhead. `createPool` maintains a reusable cache of active connections that are dynamically shared among concurrent HTTP requests, maximizing throughput and conserving server resources.

### Q2: How does `db.execute()` protect against SQL Injection?
> **Answer**: `db.execute()` uses MySQL server-side prepared statements. It separates query structure from data values. First, the SQL template with `?` placeholders is sent to the MySQL server to be parsed and compiled into an execution plan. Next, the user values are transmitted over the binary protocol. Because compilation has already completed, the database engine treats user input strictly as literal values, rendering SQL injection impossible.

### Q3: Why is `Object.hasOwn()` preferred over `obj.hasOwnProperty()`?
> **Answer**: `Object.hasOwn()` (introduced in ES2022) is safer because:
> 1. Objects created with `Object.create(null)` do not inherit from `Object.prototype`, so calling `obj.hasOwnProperty()` throws a `TypeError: obj.hasOwnProperty is not a function`.
> 2. If user-supplied input contains a property named `"hasOwnProperty"` (e.g. `{ hasOwnProperty: "fake" }`), calling `obj.hasOwnProperty()` calls the property instead of the method. `Object.hasOwn(obj, key)` works reliably in all cases.

### Q4: What does `result.affectedRows` represent in a DELETE query?
> **Answer**: `result.affectedRows` returns the count of database rows actually removed by the `DELETE` statement. In `todo.model.js`, `return result.affectedRows > 0;` returns `true` if a row was found and removed, and `false` if no row matched the given `id`, allowing the controller to return an accurate `404 Not Found` response.

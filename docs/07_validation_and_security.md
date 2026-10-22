# 07. Validation & Web Security Architecture

---

## 1. Overview of `src/validators/todo.validator.js`

The validation layer acts as a strict firewall for incoming data. It enforces the **Fail-Fast Principle**: invalid, malicious, or malformed data is rejected immediately at the boundary before it can consume business logic CPU time or database resources.

Here is the source code of [`src/validators/todo.validator.js`](file:///d:/node_project/todo-app/src/validators/todo.validator.js):

```javascript
const allowedStatuses = [
  "pending",
  "in_progress",
  "completed",
];

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

  if (
    body.description !== undefined &&
    body.description !== null &&
    typeof body.description !== "string"
  ) {
    return "Description must be a string.";
  }

  if (
    body.status !== undefined &&
    !allowedStatuses.includes(body.status)
  ) {
    return "Invalid todo status.";
  }

  return null;
};

export const validateUpdateTodo = (body) => {
  const keys = ["title", "description", "status"];

  if (!keys.some((key) => Object.hasOwn(body, key))) {
    return "At least one field is required.";
  }

  if (
    Object.hasOwn(body, "title") &&
    (typeof body.title !== "string" ||
      !body.title.trim() ||
      body.title.trim().length > 255)
  ) {
    return "Title must contain 1-255 characters.";
  }

  if (
    Object.hasOwn(body, "description") &&
    body.description !== null &&
    typeof body.description !== "string"
  ) {
    return "Description must be a string or null.";
  }

  if (
    Object.hasOwn(body, "status") &&
    !allowedStatuses.includes(body.status)
  ) {
    return "Invalid todo status.";
  }

  return null;
};
```

---

## 2. Real-Life Analogy: The Embassy Visa Screening Desk

Imagine applying for an international travel visa:
- If your passport application has a blank name field or a fake date of birth, the receptionist at the front desk rejects the application on the spot.
- They do **not** send the invalid application to the Ambassador or print a visa badge.
- **Why?** It preserves the Ambassador's precious time and protects the country against fraudulent documents.
- In our app, the validator stops bad payloads before they ever touch the controller or database.

---

## 3. Deep Dive into Security Mechanisms

### 3.1 Empty Object Prevention (`keys.some(...)`)
```javascript
const keys = ["title", "description", "status"];
if (!keys.some((key) => Object.hasOwn(body, key))) {
  return "At least one field is required.";
}
```
- **The Attack/Bug**: A client issues `PUT /api/todos/1` with an empty JSON body `{}` or random garbage `{ "hacker": true }`.
- **The Defense**: `Array.prototype.some()` verifies that at least one valid, updatable field is present in the request body. If none are found, the request is halted immediately with `400 Bad Request`.

### 3.2 Maximum Length Enforcement (Database DOS Defense)
```javascript
if (body.title.trim().length > 255) {
  return "Title cannot exceed 255 characters.";
}
```
- **The Attack**: An attacker sends a 50 Megabyte string inside `title` to exhaust server memory and trigger MySQL column truncation errors.
- **The Defense**: Strict length checks match the database column definition (`VARCHAR(255)`), preventing memory bloat and database execution errors.

### 3.3 Strict Type Checking (`typeof` & `null` distinction)
- In JavaScript, `typeof null === "object"`.
- The validator handles optional and nullable fields defensively:
  ```javascript
  body.description !== undefined && body.description !== null && typeof body.description !== "string"
  ```
  This permits `null` (to clear an existing description) while rejecting objects, arrays, booleans, or numbers.

---

## 4. Top Web Security Vulnerabilities Mitigated in this Application

| Vulnerability | Attack Vector | Project's Defense Mechanism |
|---|---|---|
| **SQL Injection (SQLi)** | Attacker inputs `' OR '1'='1` to bypass queries. | **MySQL Prepared Statements**: `db.execute()` with `?` parameters completely separates SQL code from data. |
| **Mass Assignment** | Attacker injects `{ "is_admin": true }` or overrides `id`. | **Field Whitelisting**: Only fields in `["title", "description", "status"]` are accepted. Extra fields are discarded. |
| **Prototype Pollution** | Attacker injects `{ "__proto__": { "polluted": true } }`. | **`Object.hasOwn(body, key)`**: Checks only own enumerable properties, ignoring prototype chains. |
| **Integer Overflow / NaN** | Attacker requests `/api/todos/NaN` or huge integers. | **Regex + Safe Integer**: `/^[1-9]\d*$/` and `Number.isSafeInteger()`. |
| **Information Disclosure** | Server crash leaks stack trace and database credentials to users. | **Generic Error Masking**: Global error handler logs internally via `console.error` but sends generic `"Internal server error."` to clients. |

---

## 5. Interview Questions & Model Answers

### Q1: What is the "Fail-Fast" principle and why is it important in backend engineering?
> **Answer**: The Fail-Fast principle states that any system should immediately stop execution and report an error as soon as an unexpected condition or invalid input is detected. In web applications, validating data at the edge (validator layer) before reaching the controller or database prevents wasted CPU cycles, avoids unnecessary database queries, avoids connection pool starvation, and shields internal business logic from unexpected data types.

### Q2: What is Mass Assignment vulnerability and how does this project prevent it?
> **Answer**: Mass Assignment occurs when an application automatically assigns all incoming request fields to an internal object or database record without filtering. An attacker could tamper with restricted fields like `id`, `created_at`, or `user_role`. In this project, mass assignment is prevented in `todo.model.js` and `todo.validator.js` via an explicit whitelist:
> ```javascript
> const allowedFields = ["title", "description", "status"];
> const keys = allowedFields.filter((key) => Object.hasOwn(fields, key));
> ```
> Only whitelisted keys are included in the generated SQL statement.

### Q3: Why is `body.title.trim()` necessary before checking string length?
> **Answer**: A user could send a string containing only spaces: `"   "`. In JavaScript, `typeof "   " === "string"` is true, and `"   ".length === 3` is greater than 0. Without `.trim()`, a blank title would pass validation and be saved into the database. Trimming removes whitespace from both ends, allowing `!body.title.trim()` to catch whitespace-only inputs.

### Q4: How does error handling prevent information leakage?
> **Answer**: In production environments, unhandled exceptions contain full stack traces, file paths, database usernames, and SQL query strings. If these are sent to the client, attackers can identify library versions, database table names, and server configurations to craft targeted exploits. In `app.js`, errors are logged on the server console for developers, but the client receives only a sanitized, generic message: `{ "success": false, "message": "Internal server error." }`.

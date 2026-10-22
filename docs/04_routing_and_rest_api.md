# 04. Routing & REST API Architecture

---

## 1. Overview of `src/routes/todo.routes.js`

The routing layer maps incoming HTTP method verbs and URL paths to specific controller functions. It encapsulates endpoint declarations cleanly, keeping `app.js` free of route-specific clutter.

Here is the entire source code of [`src/routes/todo.routes.js`](file:///d:/node_project/todo-app/src/routes/todo.routes.js):

```javascript
import { Router } from "express";
import {
  createTodo,
  getTodos,
  getTodoById,
  updateTodo,
  updateTodoStatus,
  deleteTodo,
} from "../controllers/todo.controller.js";

const router = Router();

router.post("/", createTodo);
router.get("/", getTodos);
router.get("/:id", getTodoById);
router.put("/:id", updateTodo);
router.patch("/:id/status", updateTodoStatus);
router.delete("/:id", deleteTodo);

export default router;
```

---

## 2. REST API Design Principles

**REST** stands for **Representational State Transfer**. A RESTful API organizes resources using nouns (e.g. `/api/todos`) and interacts with those resources using standard HTTP verbs:

| HTTP Verb | Route | Action | Purpose | Expected Status | Idempotent? |
|---|---|---|---|---|---|
| **POST** | `/api/todos` | Create | Creates a new todo resource | `201 Created` | **No** |
| **GET** | `/api/todos` | Read All | Fetches list of all todos | `200 OK` | **Yes** |
| **GET** | `/api/todos/:id` | Read One | Fetches single todo by ID | `200 OK` / `404 Not Found` | **Yes** |
| **PUT** | `/api/todos/:id` | Update | Replaces or updates todo fields | `200 OK` / `404 Not Found` | **Yes** |
| **PATCH** | `/api/todos/:id/status`| Partial Update | Updates specifically the `status` | `200 OK` / `404 Not Found` | **No** (or conditionally) |
| **DELETE**| `/api/todos/:id` | Delete | Removes the specified todo | `200 OK` / `404 Not Found` | **Yes** |

---

## 3. Real-Life Analogy: A Post Office Service Window

To explain REST routing in an interview:
- **The Resource (`/api/todos`)**: A specific PO Box department.
- **POST**: Dropping a brand-new package into the mailbox. Every time you send one, a new package is created (Not idempotent).
- **GET**: Asking the clerk: "Show me all letters in my box" or "Show me letter #5". Looking at letters doesn't alter them (Safe & Idempotent).
- **PUT**: Replacing your entire mail package with an updated version.
- **PATCH**: Putting a single "Priority / Completed" sticker on your existing envelope without modifying the envelope's contents.
- **DELETE**: Requesting the postal clerk to shred letter #5. Doing it once shreds it; doing it again still results in letter #5 being gone (Idempotent).

---

## 4. Key Concepts & Technical Nuances

### 4.1 Route Parameters (`:id`)
- Syntax: `/:id`
- How Express handles it: Express compiles the route string into a regular expression. When a request matches `/api/todos/42`, Express extracts `42` and populates `req.params.id = "42"`.
- **Note**: `req.params.id` is always a **string**, never a number! This is why our controller runs it through `parseId()`.

### 4.2 PUT vs. PATCH (Major Interview Topic)
- **`PUT /:id`**: Historically meant to represent complete resource replacement. In our controller, it updates whichever permitted fields (`title`, `description`, `status`) are provided in the payload.
- **`PATCH /:id/status`**: Specifically designed for partial, atomic updates. It updates **only** the status property without requiring or allowing other fields.

### 4.3 What is HTTP Idempotency?
An HTTP method is considered **idempotent** if making the same request multiple times produces the exact same server state as making it once.
- `GET /api/todos/1`: Calling it 10 times does not change the database. (Idempotent).
- `DELETE /api/todos/1`: Calling it once deletes record 1. Calling it again finds record 1 already absent. The state of the database remains "record 1 does not exist". (Idempotent).
- `POST /api/todos`: Calling it 10 times creates 10 distinct records in the database! (Non-idempotent).

---

## 5. HTTP Status Codes Used in this Project

1. **`200 OK`**: The request succeeded, and response body contains relevant data (e.g. fetched or updated todo).
2. **`201 Created`**: The resource was successfully created. Used specifically in `POST /api/todos`.
3. **`400 Bad Request`**: The client sent invalid or malformed data (e.g. empty title, non-numeric ID, invalid status).
4. **`404 Not Found`**: The requested route does not exist, or a todo with the requested `:id` was not found in the database.
5. **`500 Internal Server Error`**: An unexpected exception occurred on the server (e.g. database connection lost, disk failure).

---

## 6. Interview Questions & Model Answers

### Q1: What is the technical difference between `req.params`, `req.query`, and `req.body`?
> **Answer**:
> - `req.params`: Captures values from named URL path segments (e.g., `/api/todos/:id` -> `req.params.id`). Always extracted from the URL path.
> - `req.query`: Captures key-value pairs from the URL search query string following `?` (e.g., `/api/todos?status=completed` -> `req.query.status`).
> - `req.body`: Captures data submitted in the payload body of an HTTP request (JSON or form-urlencoded), parsed by `express.json()`. Used with POST, PUT, and PATCH.

### Q2: What is the difference between PUT and PATCH?
> **Answer**: Under the HTTP specification (RFC 7231):
> - **PUT** is intended for complete replacement of a resource document. If fields are omitted in a strict PUT request, they may be cleared or set to default values.
> - **PATCH** is intended for partial modification. Only the specified fields are modified, leaving all existing attributes untouched. In this project, `PATCH /:id/status` is used to update the status enum without transmitting title or description.

### Q3: What is idempotency and which HTTP methods are idempotent?
> **Answer**: Idempotency means that executing the same operation multiple times yields the same resultant system state as executing it once:
> - **Idempotent**: `GET`, `HEAD`, `PUT`, `DELETE`, `OPTIONS`. (e.g., Deleting ID 5 once deletes it. Deleting ID 5 five times leaves it deleted).
> - **Non-Idempotent**: `POST` (repeating a POST creates duplicate items).

### Q4: Why is `express.Router()` preferred over attaching routes directly to `app`?
> **Answer**: `express.Router()` acts as an isolated mini-application. It provides modularity, encapsulation, and scalability. It allows developers to group related routes into distinct modules (e.g., `todo.routes.js`, `user.routes.js`) and mount them at a shared root prefix (`app.use("/api/todos", todoRoutes)`), making testing, maintenance, and team collaboration manageable.

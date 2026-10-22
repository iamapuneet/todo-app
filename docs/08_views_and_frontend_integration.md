# 08. Views & Frontend Integration (EJS & Client Architecture)

---

## 1. Overview of `src/views/index.ejs`

The presentation layer of this application utilizes **EJS (Embedded JavaScript)**, a server-side templating engine. The application combines **Server-Side Rendering (SSR)** for the initial HTML shell with **Client-Side REST API consumption (CSR)** via the browser's native `fetch` API.

Here is how Express triggers template rendering in [`src/app.js`](file:///d:/node_project/todo-app/src/app.js#L15-L20):

```javascript
app.get("/", (req, res) => {
  res.render("index", {
    title: "Todo App",
    message: "Welcome to my Todo App"
  });
});
```

---

## 2. Server-Side Rendering (SSR) vs. Client-Side Rendering (CSR)

This application demonstrates a modern **Hybrid Architecture**:

```
[Initial Request: GET /]
      │
      ▼
Server renders EJS template ──▶ Returns fully structured HTML document
                                         │
                                         ▼
                               Browser loads HTML & executes <script>
                                         │
                                         ▼
                               Client-side JS calls GET /api/todos
                                         │
                                         ▼
                               Dynamically populates Todo Cards
```

### SSR vs. CSR Comparison:

| Feature | Server-Side Rendering (SSR / EJS) | Client-Side Rendering (CSR / React, Vue) |
|---|---|---|
| **Rendering Location** | Rendered on the Node.js server before network transit. | Rendered in the user's browser using JavaScript. |
| **Initial Load Speed** | Fast First Contentful Paint (FCP); HTML is immediately visible. | Slower initial load; must download JS bundles first. |
| **SEO Performance** | Excellent; search engine bots parse pre-rendered HTML. | Requires dynamic rendering or SSR frameworks (Next.js). |
| **Server Load** | Higher server CPU usage per page render. | Minimal server load; server only serves static files & JSON. |
| **Interactivity** | Requires subsequent full-page reloads without AJAX. | Highly dynamic and fluid without page refreshes. |

---

## 3. Real-Life Analogy: The Restaurant Menu

- **Pure SSR**: The restaurant owner writes today's special dishes on a physical blackboard at the entrance every morning. The moment you walk in, you read the board immediately (Fast initial paint).
- **Pure CSR**: You sit down at a table with an empty digital tablet. The tablet turns on, connects to the WiFi, downloads the menu from the cloud, and then displays the dishes.
- **Hybrid (This Project)**: The physical blackboard has the restaurant name and layout (SSR via EJS), and the digital tablet on your table dynamically pulls live order statuses and updates them in real time (REST API via `fetch`).

---

## 4. EJS Syntax & Delimiters Deep Dive

EJS allows standard JavaScript logic embedded within HTML markup:

| Delimiter | Name | Behavior | Security Consequence |
|---|---|---|---|
| `<%= expression %>` | **Escaped Output** | Evaluates the expression and escapes HTML characters (`<`, `>`, `&`, `"`, `'`). | **Safe**: Prevents Stored Cross-Site Scripting (XSS). |
| `<%- expression %>` | **Unescaped Output**| Evaluates the expression and outputs raw HTML directly. | **Dangerous**: If used with untrusted user input, permits XSS attacks! |
| `<% scriptlet %>` | **Control Flow** | Executes JavaScript loops, conditionals, or variable declarations without outputting HTML. | Used for `if (todos.length > 0) { ... }` or loops. |
| `<%# comment %>` | **Comment** | Comments out template code; never sent to the browser. | Safe notes for developers. |

---

## 5. Client-Side JavaScript Architecture in `index.ejs`

The client-side script embedded within [`src/views/index.ejs`](file:///d:/node_project/todo-app/src/views/index.ejs) manages full CRUD interactions with the REST API:

### 5.1 Fetching All Todos (`GET /api/todos`)
```javascript
async function loadTodos() {
  try {
    const res = await fetch("/api/todos");
    const json = await res.json();
    if (json.success) {
      todos = json.data;
      renderTodos();
    }
  } catch (err) {
    showNotification("Failed to load todos.", "error");
  }
}
```

### 5.2 Creating a Todo (`POST /api/todos`)
```javascript
async function handleCreateTodo(e) {
  e.preventDefault();
  const payload = {
    title: document.getElementById("titleInput").value,
    description: document.getElementById("descInput").value,
    status: document.getElementById("statusSelect").value,
  };

  const res = await fetch("/api/todos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const json = await res.json();
  if (json.success) {
    loadTodos();
  } else {
    showNotification(json.message, "error");
  }
}
```

### 5.3 Partial Status Toggle (`PATCH /api/todos/:id/status`)
When a user updates a task status, the client sends a focused PATCH request without re-submitting title or description:
```javascript
await fetch(`/api/todos/${id}/status`, {
  method: "PATCH",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ status: newStatus }),
});
```

---

## 6. Interview Questions & Model Answers

### Q1: What is the difference between `<%= %>` and `<%- %>` in EJS, and what are the security risks?
> **Answer**: 
> - `<%= %>` automatically escapes HTML entities (e.g. converting `<script>` into `&lt;script&gt;`). This neutralizes malicious scripts and prevents Cross-Site Scripting (XSS) attacks.
> - `<%- %>` outputs raw HTML without any sanitization or escaping. If user-generated content (like a todo title containing `<script>alert('hacked')</script>`) is rendered using `<%- %>`, the attacker's script will execute in the browser of any user viewing the page. Raw output should only be used for trusted, pre-sanitized HTML.

### Q2: How does `res.render()` work under the hood in Express?
> **Answer**: When `res.render(view, locals)` is called:
> 1. Express looks up the configured view engine (`ejs`) and the views folder (`src/views`).
> 2. It reads the template file (`index.ejs`) from the filesystem.
> 3. It compiles the template into a JavaScript rendering function.
> 4. It passes the `locals` object (`{ title, message }`) into the compiled function, which replaces delimiters with data.
> 5. Express sets the `Content-Type: text/html; charset=utf-8` header and sends the completed HTML string to the client socket using `res.send()`.

### Q3: Why is an API-driven frontend architecture preferred over standard form submissions?
> **Answer**: Standard HTML `<form>` submissions trigger a full browser navigation cycle, causing the entire page to unload, reload, re-render, and flicker. Using the browser's `fetch()` API to communicate with JSON REST endpoints enables smooth, asynchronous updates without page reloads (SPA experience), reduces network payload size (transferring small JSON objects instead of entire HTML documents), and allows the same backend API to serve mobile apps or third-party integrations.

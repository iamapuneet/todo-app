# 05. Controllers & Business Logic Architecture

---

## 1. Overview of `src/controllers/todo.controller.js`

The controller acts as the orchestrator of the application. It receives parsed requests from the router, delegates data verification to the validator, coordinates with the model layer to query or mutate the database, and delivers a standardized JSON envelope back to the client.

Here is the source code of [`src/controllers/todo.controller.js`](file:///d:/node_project/todo-app/src/controllers/todo.controller.js):

```javascript
import * as Todo from "../models/todo.model.js";
import * as response from "../utils/api-response.js";
import * as validator from "../validators/todo.validator.js";

const parseId = (value) => {
  if (!/^[1-9]\d*$/.test(value)) return null;

  const id = Number(value);
  return Number.isSafeInteger(id) ? id : null;
};

export const createTodo = async (req, res) => {
  const validationError = validator.validateCreateTodo(req.body);

  if (validationError) {
    return response.error(res, validationError);
  }

  const todo = await Todo.create({
    title: req.body.title.trim(),
    description: req.body.description,
    status: req.body.status,
  });

  return response.success(res, "Todo created successfully.", todo, 201);
};

export const getTodos = async (req, res) => {
  const todos = await Todo.findAll();

  return response.success(res, "Todos fetched successfully.", todos);
};

export const getTodoById = async (req, res) => {
  const id = parseId(req.params.id);

  if (!id) return response.error(res, "Invalid todo ID.");

  const todo = await Todo.findById(id);

  if (!todo) return response.error(res, "Todo not found.", 404);

  return response.success(res, "Todo fetched successfully.", todo);
};

export const updateTodo = async (req, res) => {
  const id = parseId(req.params.id);

  if (!id) return response.error(res, "Invalid todo ID.");

  const validationError = validator.validateUpdateTodo(req.body);

  if (validationError) {
    return response.error(res, validationError);
  }

  const existing = await Todo.findById(id);

  if (!existing) return response.error(res, "Todo not found.", 404);

  const fields = { ...req.body };

  if (typeof fields.title === "string") {
    fields.title = fields.title.trim();
  }

  const todo = await Todo.update(id, fields);

  return response.success(res, "Todo updated successfully.", todo);
};

export const updateTodoStatus = async (req, res) => {
  const id = parseId(req.params.id);

  if (!id) return response.error(res, "Invalid todo ID.");

  if (
    typeof req.body.status !== "string" ||
    !["pending", "in_progress", "completed"].includes(req.body.status)
  ) {
    return response.error(res, "Invalid todo status.");
  }

  const existing = await Todo.findById(id);

  if (!existing) return response.error(res, "Todo not found.", 404);

  const todo = await Todo.update(id, { status: req.body.status });

  return response.success(res, "Todo status updated successfully.", todo);
};

export const deleteTodo = async (req, res) => {
  const id = parseId(req.params.id);

  if (!id) return response.error(res, "Invalid todo ID.");

  const deleted = await Todo.remove(id);

  if (!deleted) return response.error(res, "Todo not found.", 404);

  return response.success(res, "Todo deleted successfully.", { id });
};
```

---

## 2. Deep Dive: The `parseId()` Security Helper

One of the most impressive patterns in this project for interviewers is the defensive implementation of `parseId`:

```javascript
const parseId = (value) => {
  if (!/^[1-9]\d*$/.test(value)) return null;

  const id = Number(value);
  return Number.isSafeInteger(id) ? id : null;
};
```

### Why standard `parseInt(value, 10)` is dangerous:
- `parseInt("10abc", 10)` returns `10`, silently stripping dirty strings!
- `parseInt("-5", 10)` returns `-5` (negative IDs do not exist in MySQL `AUTO_INCREMENT`).
- `parseInt("0", 10)` returns `0`.
- `Number("999999999999999999999")` overflows IEEE 754 64-bit float precision, causing silent math rounding errors.

### How `parseId()` provides bulletproof defense:
1. **Regular Expression `^[1-9]\d*$`**:
   - `^`: Matches start of the string.
   - `[1-9]`: Requires the first character to be a non-zero digit (1 through 9). This prevents leading zeroes (`012`), zero itself (`0`), and negative numbers (`-1`).
   - `\d*`: Allows zero or more digits afterwards.
   - `$`: Matches end of the string, ensuring no alphanumeric suffixes exist (`10abc` fails).
2. **`Number.isSafeInteger(id)`**:
   - Ensures the parsed number lies within `-(2^53 - 1)` and `(2^53 - 1)` (`Number.MAX_SAFE_INTEGER`). This prevents numerical overflow attacks against database engines.

---

## 3. Standardized Response Envelope (`api-response.js`)

In [`src/utils/api-response.js`](file:///d:/node_project/todo-app/src/utils/api-response.js), all controller responses are wrapped:

```javascript
export const success = (res, message, data, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

export const error = (res, message, statusCode = 400) => {
  return res.status(statusCode).json({
    success: false,
    message,
  });
};
```

### Benefits for Frontend Integration:
- **Predictable Data Contract**: Frontend engineers can always check `if (response.data.success)` to handle outcomes without parsing unpredictable object shapes.
- **Uniform Error Handling**: Both client-side fetch APIs and unit tests can reliably access `response.data.message`.

---

## 4. Real-Life Analogy: The Bank Teller

Think of the controller as a **Bank Teller**:
1. **Customer approaches**: "I want to withdraw money from Account `XYZ`."
2. **Account Check (`parseId`)**: The teller inspects the account number format. If it has alphabets or invalid symbols, the teller rejects the slip immediately.
3. **Identity Verification (`existing` check)**: The teller queries the central system (`Todo.findById`) to see if the account exists. If not, tells the customer: "Account not found" (404).
4. **Execution**: The teller communicates with the vault (`Todo.update` or `Todo.remove`).
5. **Receipt (`api-response.js`)**: Hands the customer a standardized receipt with a timestamp, confirmation code, and status.

---

## 5. Defensive Programming Highlights in Controllers

1. **Existence Check before Mutation**:
   - In both `updateTodo`, `updateTodoStatus`, and `deleteTodo`, the controller queries the database first to confirm the record exists. This ensures clear, accurate HTTP semantics: returning `404 Not Found` rather than a ambiguous generic error.
2. **String Trimming**:
   - `fields.title.trim()` prevents whitespace-only titles or accidental leading/trailing spaces from persisting to the database.
3. **Shallow Copy Isolation**:
   - `const fields = { ...req.body };` creates a shallow clone of the request body, preventing accidental side-effect mutations to the original incoming payload object.

---

## 6. Interview Questions & Model Answers

### Q1: Why is `parseId()` implemented with both Regex and `Number.isSafeInteger()`?
> **Answer**: JavaScript numbers are IEEE 754 double-precision floating-point numbers. Standard functions like `parseInt()` are too forgiving—they parse strings like `"10abc"` as `10` and accept negative numbers. 
> - The regex `/^[1-9]\d*$/` strictly enforces positive integer string format with no letters, decimal points, or negative signs.
> - `Number.isSafeInteger()` ensures the parsed number does not exceed `2^53 - 1`, protecting against precision loss and integer overflow attacks.

### Q2: Why is `return` used before `res.status().json()` throughout the controllers?
> **Answer**: `res.json()` terminates the response transmission to the client, but it does **not** stop the execution of the surrounding JavaScript function! If you omit `return`:
> ```javascript
> if (!todo) response.error(res, "Todo not found.", 404);
> // Without return, this line still executes and attempts to send another response!
> response.success(res, "Todo fetched.", todo);
> ```
> This causes Node.js to throw `ERR_HTTP_HEADERS_SENT: Cannot set headers after they are sent to the client`. Adding `return` guarantees immediate function exit.

### Q3: What is the benefit of a standardized API response envelope (`{ success, message, data }`)?
> **Answer**: Standardized response envelopes establish a consistent contract between the backend and client consumers. Frontend clients can write centralized response interceptors (e.g. in Axios or Fetch wrappers) to inspect `res.success` globally, automatically showing toast notifications for `message` or unwrapping `data`. It also prevents frontend crashes caused by inconsistent API response shapes across different endpoints.

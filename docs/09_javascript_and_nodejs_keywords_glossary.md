# 09. JavaScript & Node.js Keywords Encyclopedia

This guide provides an in-depth, line-by-line breakdown of every single JavaScript and Node.js keyword, operator, and language construct used across this Todo application. Each keyword includes its formal definition, real-world analogy, project code snippet, and interview gotchas.

---

## 1. `import` and `export` (ES Modules)

### Definition
ES Modules (ESM) is the standardized specification for modular JavaScript code in ECMAScript. In Node.js, setting `"type": "module"` in `package.json` activates ESM syntax (`import`/`export`) instead of legacy CommonJS (`require`/`module.exports`).

### Used in Project
- **Named Import**: `import { Router } from "express";` ([todo.routes.js:L1](file:///d:/node_project/todo-app/src/routes/todo.routes.js#L1))
- **Namespace Import**: `import * as Todo from "../models/todo.model.js";` ([todo.controller.js:L1](file:///d:/node_project/todo-app/src/controllers/todo.controller.js#L1))
- **Default Export**: `export default app;` ([app.js:L40](file:///d:/node_project/todo-app/src/app.js#L40))
- **Named Export**: `export const createTodo = async ...` ([todo.controller.js:L12](file:///d:/node_project/todo-app/src/controllers/todo.controller.js#L12))
- **Side-Effect Import**: `import "dotenv/config";` ([server.js:L1](file:///d:/node_project/todo-app/src/server.js#L1))

### Real-Life Analogy: International Shipping Containers
Think of each file as a private workshop. By default, its contents are locked inside.
- `export`: Packing a tool into a standardized crate and stamping your company logo on it.
- `import`: Receiving that crate in another factory and unboxing it for assembly.
- `import "dotenv/config"`: Flipping the master breaker switch for the whole building without unboxing any individual tool.

### Interview Gotcha
Imports in ESM are **statically analyzed and hoisted** before the module executes. You cannot place an `import` statement conditionally inside an `if` block (unless using the dynamic `import()` function).

---

## 2. `async` and `await`

### Definition
Syntactic sugar layered over native JavaScript Promises, making asynchronous, non-blocking code read and behave like synchronous sequential code without blocking the Node.js Event Loop.

### Used in Project
- [`src/server.js:L7-L18`](file:///d:/node_project/todo-app/src/server.js#L7-L18):
  ```javascript
  async function startServer() {
    try {
      await db.query("SELECT 1");
      app.listen(PORT, ...);
    } catch (err) { ... }
  }
  ```
- [`src/models/todo.model.js:L3-L9`](file:///d:/node_project/todo-app/src/models/todo.model.js#L3-L9):
  ```javascript
  export const create = async ({ title, description, status }) => {
    const [result] = await db.execute(SQL, [...]);
    return findById(result.insertId);
  };
  ```

### Real-Life Analogy: The Coffee Shop Buzzer
- **Synchronous (Blocking)**: You stand at the cash counter waiting for the barista to brew your espresso. Nobody behind you in line can order until your drink is in your hand. The whole shop freezes.
- **Asynchronous (`await`)**: The cashier gives you a vibrating buzzer (a `Promise`). You step aside (`await`), allowing the cashier to take orders from 50 other customers. When your espresso is ready, your buzzer vibrates, and you resume collecting your drink.

### Interview Gotcha
- An `async` function **always** returns a Promise, even if you return a plain value (e.g. `return 42` wraps `42` inside `Promise.resolve(42)`).
- Forgetting `await` before a promise returns the unresolved `Promise { <pending> }` object rather than the database data, often leading to subtle bugs like `[object Promise]` in logs.

---

## 3. `const`, `let`, and `var`

### Definition
- `const`: Block-scoped variable declaration that cannot be reassigned or re-declared.
- `let`: Block-scoped variable that can be reassigned.
- `var`: Legacy function-scoped or globally-scoped variable that hoists with `undefined`. (Avoided in modern codebases).

### Used in Project
- `const app = express();` ([app.js:L7](file:///d:/node_project/todo-app/src/app.js#L7))
- `const PORT = process.env.PORT || 3000;` ([server.js:L5](file:///d:/node_project/todo-app/src/server.js#L5))

### Real-Life Analogy: Permanent Tattoo vs Whiteboard Marker
- `const`: A permanent tattoo. Once drawn, the name cannot be replaced with another string. (Note: If the tattoo is a box, you can still put things *inside* the box, because objects are mutated by reference, not reassigned).
- `let`: A whiteboard where you can wipe out "Pending" and write "Completed".

### Interview Gotcha
`const` prevents **reassignment**, NOT mutation!
```javascript
const fields = { title: "Test" };
fields.title = "Updated"; // Perfectly valid!
fields = { title: "New" }; // TypeError: Assignment to constant variable.
```

---

## 4. `try` ... `catch`

### Definition
Construct used for structural exception handling. Code within the `try` block executes; if any synchronous or `await`ed operation throws an error, execution transfers immediately to the `catch` block.

### Used in Project
- [`src/server.js:L8-L17`](file:///d:/node_project/todo-app/src/server.js#L8-L17):
  ```javascript
  try {
    await db.query("SELECT 1");
    app.listen(PORT, ...);
  } catch (err) {
    console.error("Database connection failed:", err.message);
    process.exit(1);
  }
  ```

### Real-Life Analogy: The Circus Trapeze Safety Net
A gymnast attempts a daring mid-air flip (`try`). If they slip and fall, the net underneath catches them (`catch`), preventing fatal injury, allowing the show to continue safely.

### Interview Gotcha
In Express 4, a `try/catch` was mandatory around every `await` in route handlers. In Express 5, unhandled promise rejections are caught automatically and forwarded to the 4-argument error handler.

---

## 5. `Object.hasOwn()` vs `hasOwnProperty()`

### Definition
`Object.hasOwn(object, propertyKey)` is a static method introduced in ECMAScript 2022 that returns `true` if the specified object possesses the indicated property as its own direct property (not inherited).

### Used in Project
- [`src/models/todo.model.js:L33-L35`](file:///d:/node_project/todo-app/src/models/todo.model.js#L33-L35):
  ```javascript
  const keys = allowedFields.filter((key) =>
    Object.hasOwn(fields, key)
  );
  ```
- [`src/validators/todo.validator.js:L41`](file:///d:/node_project/todo-app/src/validators/todo.validator.js#L41):
  ```javascript
  if (!keys.some((key) => Object.hasOwn(body, key)))
  ```

### Real-Life Analogy: DNA Paternity Test
- Inherited property (`in` operator): Like a family trait (e.g. eye color inherited from grandparents).
- `Object.hasOwn`: A DNA test verifying whether this specific individual uniquely owns that specific asset directly.

### Interview Gotcha: Why is it superior to `obj.hasOwnProperty()`?
1. **Objects with null prototypes**: Objects created with `Object.create(null)` do not have `Object.prototype` in their prototype chain. Calling `obj.hasOwnProperty("title")` throws a fatal `TypeError: obj.hasOwnProperty is not a function`.
2. **Property shadowing**: If a malicious client sends `{ "hasOwnProperty": "evil" }`, calling `body.hasOwnProperty("title")` crashes because the property has overwritten the method. `Object.hasOwn()` never fails.

---

## 6. Nullish Coalescing Operator (`??`) vs Logical OR (`||`)

### Definition
- `??` (Nullish Coalescing): Returns the right-hand operand only if the left-hand operand is `null` or `undefined`.
- `||` (Logical OR): Returns the right-hand operand if the left-hand operand is **any falsy value** (`null`, `undefined`, `""`, `0`, `false`, `NaN`).

### Used in Project
- [`src/models/todo.model.js:L8`](file:///d:/node_project/todo-app/src/models/todo.model.js#L8):
  ```javascript
  [title, description ?? null, status ?? "pending"]
  ```
- [`src/models/todo.model.js:L28`](file:///d:/node_project/todo-app/src/models/todo.model.js#L28):
  ```javascript
  return rows[0] ?? null;
  ```

### Real-Life Analogy: The Backup Generator
- `||`: Turns on the emergency generator if the light switch is off, if the bulb is dim, if the meter is zero, or if the power is cut.
- `??`: Turns on the generator **only** if the power grid cable is physically missing (`null` / `undefined`).

### Interview Gotcha: Why `??` is crucial for data fields
```javascript
const description = ""; // User explicitly emptied the description
const desc1 = description || "Default Description"; 
// desc1 becomes "Default Description" (WRONG! User wanted empty string)

const desc2 = description ?? "Default Description";
// desc2 preserves "" (CORRECT! "" is not null or undefined)
```

---

## 7. Array Methods: `map()`, `filter()`, `some()`, `includes()`, `join()`

### 7.1 `filter()`
- **Definition**: Creates a new array with all elements that pass the predicate function.
- **Used**: `allowedFields.filter((key) => Object.hasOwn(fields, key))` ([todo.model.js:L33](file:///d:/node_project/todo-app/src/models/todo.model.js#L33)).
- **Analogy**: A metal detector filtering out non-metallic objects.

### 7.2 `map()`
- **Definition**: Creates a new array populated with the results of calling a provided function on every element.
- **Used**: `keys.map((key) => `\`${key}\` = ?`).join(", ")` ([todo.model.js:L40](file:///d:/node_project/todo-app/src/models/todo.model.js#L40)).
- **Analogy**: A cookie cutter stamping every block of dough into a star shape.

### 7.3 `some()`
- **Definition**: Tests whether at least one element in the array passes the test. Returns boolean.
- **Used**: `if (!keys.some((key) => Object.hasOwn(body, key)))` ([todo.validator.js:L41](file:///d:/node_project/todo-app/src/validators/todo.validator.js#L41)).
- **Analogy**: Checking if at least one light bulb in the chandelier is turned on.

### 7.4 `includes()`
- **Definition**: Determines whether an array includes a certain value. Returns boolean.
- **Used**: `!allowedStatuses.includes(body.status)` ([todo.validator.js:L30](file:///d:/node_project/todo-app/src/validators/todo.validator.js#L30)).
- **Analogy**: Checking if a VIP guest's name appears on the guest list.

---

## 8. Spread Operator (`...`)

### Definition
The spread operator (`...`) allows an iterable (like an array or object expression) to be expanded in places where zero or more arguments or elements are expected.

### Used in Project
- **Object Cloning**: `const fields = { ...req.body };` ([todo.controller.js:L61](file:///d:/node_project/todo-app/src/controllers/todo.controller.js#L61))
- **Array Flattening**: `[...values, id]` ([todo.model.js:L47](file:///d:/node_project/todo-app/src/models/todo.model.js#L47))

### Real-Life Analogy: Photocopying & Unpacking a Suitcase
- **Object Spread**: Making a photocopy of a legal contract before highlighting changes so the original document remains pristine.
- **Array Spread**: Emptying the clothes from your suitcase directly onto the hotel bed alongside your shoes: `[...clothes, shoes]`.

### Interview Gotcha
The spread operator performs a **shallow copy**, not a deep copy! If the object contains nested objects or arrays, the inner objects are copied by reference.

---

## 9. Array Destructuring

### Definition
Unpacks values from arrays or properties from objects into distinct, individual variables.

### Used in Project
- [`src/models/todo.model.js:L4`](file:///d:/node_project/todo-app/src/models/todo.model.js#L4):
  ```javascript
  const [result] = await db.execute(...);
  ```
- [`src/models/todo.model.js:L15`](file:///d:/node_project/todo-app/src/models/todo.model.js#L15):
  ```javascript
  const [rows] = await db.execute(...);
  ```

### Why MySQL2 returns an array:
`mysql2/promise` queries return a tuple: `[rows, fieldsMetadata]`. By writing `const [rows]`, we unpack the first element (`rows`) and ignore the technical column metadata.

---

## 10. Regular Expression & `test()`

### Definition
A pattern used for matching character combinations in strings. The `.test()` method executes a search for a match between a regular expression and a specified string, returning `true` or `false`.

### Used in Project
- [`src/controllers/todo.controller.js:L6`](file:///d:/node_project/todo-app/src/controllers/todo.controller.js#L6):
  ```javascript
  if (!/^[1-9]\d*$/.test(value)) return null;
  ```

### Breakdown of `/^[1-9]\d*$/`:
- `/ ... /`: Regular expression boundary delimiters.
- `^`: Asserts the start of the string.
- `[1-9]`: Matches exactly one digit between 1 and 9 (blocks `0`, `-`, and letters).
- `\d*`: Matches zero or more digits (0-9) following the first digit.
- `$`: Asserts the end of the string (blocks trailing characters like `123abc`).

---

## 11. `Number.isSafeInteger()`

### Definition
Determines whether the provided value is a number that is a **safe integer** in JavaScript (between `-(2^53 - 1)` and `2^53 - 1`).

### Used in Project
- [`src/controllers/todo.controller.js:L9`](file:///d:/node_project/todo-app/src/controllers/todo.controller.js#L9):
  ```javascript
  return Number.isSafeInteger(id) ? id : null;
  ```

### Why needed:
JavaScript represents all numbers as IEEE 754 double-precision floats. Integers larger than `9,007,199,254,740,991` (`Number.MAX_SAFE_INTEGER`) lose precision. If an attacker inputs `9007199254740992` and `9007199254740993`, JavaScript considers them identical, causing data collision bugs.

---

## 12. `process.env` and `process.exit()`

### Definition
- `process.env`: An object containing the user environment variables passed to the Node.js process upon execution.
- `process.exit(code)`: Instructs Node.js to terminate the process synchronously with the specified exit status.

### Used in Project
- `process.env.PORT` ([server.js:L5](file:///d:/node_project/todo-app/src/server.js#L5))
- `process.exit(1);` ([server.js:L16](file:///d:/node_project/todo-app/src/server.js#L16))

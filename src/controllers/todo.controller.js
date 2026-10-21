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
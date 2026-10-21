
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

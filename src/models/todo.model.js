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
    `UPDATE todos SET ${setClause}, \`updated_at\` = NOW() WHERE id = ?`,
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
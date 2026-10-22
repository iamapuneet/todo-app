import "dotenv/config";
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

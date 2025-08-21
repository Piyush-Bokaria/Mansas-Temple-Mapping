import pg from "pg";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import express from "express";

dotenv.config();
const app = new express();
const port = 5000;
const db = new pg.Client({
  user: process.env.USER,
  host: process.env.HOST,
  database: process.env.DB,
  password: process.env.DB_PASSWORD,
  port: 5432,
});
db.connect();

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/getTemples", async (req, res) => {
  try {
    const deity = req.query.deity || "All";
    const district = req.query.district || "All";

    let query = "SELECT * FROM public.temple";
    let conditions = [];
    let values = [];

    if (deity !== "All") {
      conditions.push("god_categy = $" + (values.length + 1));
      values.push(deity);
    }

    if (district !== "All") {
      conditions.push("dtname = $" + (values.length + 1));
      values.push(district);
    }

    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }

    query += " ORDER BY id ASC";

    console.log("Executing query:", query, "with values:", values);
    const result = await db.query(query, values);
    const data = result.rows;

    res.json(data);
  } catch (err) {
    console.error("Database error:", err);
    res
      .status(500)
      .json({ error: "Internal server error", message: err.message });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

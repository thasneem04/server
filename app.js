import express from "express";
import cors from "cors";
import chatRoutes from "./routes/chatRoutes.js";
import todoRoutes from "./routes/todoRoutes.js";

const app = express();

app.use(cors());
app.use(express.json({ limit: "512kb" }));
app.use("/api/chat", chatRoutes);
app.use("/api/todos", todoRoutes);

export default app;

import express from "express";
import { rateLimit } from "express-rate-limit";
import { chat } from "../controllers/chatController.js";

const router = express.Router();

const chatLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many chat requests. Please try again later." },
});

router.post("/", chatLimiter, chat);

export default router;

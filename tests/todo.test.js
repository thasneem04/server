import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";
import app from "../app.js";
import Todo from "../models/todoModel.js";

let mongoServer;
const existingGeminiApiKey = process.env.GEMINI_API_KEY;

beforeAll(async () => {
  delete process.env.GEMINI_API_KEY;
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
  if (existingGeminiApiKey === undefined) {
    delete process.env.GEMINI_API_KEY;
  } else {
    process.env.GEMINI_API_KEY = existingGeminiApiKey;
  }
});

beforeEach(async () => {
  await Todo.deleteMany({});
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("Todo API", () => {
  describe("POST /api/todos", () => {
    it("creates and returns a todo", async () => {
      const response = await request(app)
        .post("/api/todos")
        .send({ task: "Write tests" });

      expect(response.status).toBe(201);
      expect(response.body).toEqual(
        expect.objectContaining({
          _id: expect.any(String),
          task: "Write tests",
        }),
      );
    });

    it("returns an error when task is missing", async () => {
      const response = await request(app).post("/api/todos").send({});

      expect(response.status).toBe(500);
      expect(response.body.message).toEqual(expect.any(String));
      expect(await Todo.countDocuments()).toBe(0);
    });
  });

  describe("POST /api/chat", () => {
    it("rejects an invalid messages payload", async () => {
      const response = await request(app).post("/api/chat").send({ messages: [] });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("A non-empty messages array is required.");
    });

    it("returns a service error when the Gemini key is not configured", async () => {
      const response = await request(app)
        .post("/api/chat")
        .send({ messages: [{ role: "user", content: "Help me plan my day." }] });

      expect(response.status).toBe(503);
      expect(response.body.message).toBe(
        "The Gemini API key is not configured on the server.",
      );
    });
  });

  describe("GET /api/todos", () => {
    it("returns all todos", async () => {
      await Todo.create([{ task: "First task" }, { task: "Second task" }]);

      const response = await request(app).get("/api/todos");

      expect(response.status).toBe(201);
      expect(response.body).toHaveLength(2);
      expect(response.body.map(({ task }) => task)).toEqual([
        "First task",
        "Second task",
      ]);
    });

    it("returns an error when the database query fails", async () => {
      jest
        .spyOn(Todo, "find")
        .mockRejectedValueOnce(new Error("Database query failed"));

      const response = await request(app).get("/api/todos");

      expect(response.status).toBe(500);
      expect(response.body.message).toBe("Database query failed");
    });
  });

  describe("PUT /api/todos/:id", () => {
    it("updates and returns the todo", async () => {
      const todo = await Todo.create({ task: "Old task" });

      const response = await request(app)
        .put(`/api/todos/${todo.id}`)
        .send({ task: "Updated task" });

      expect(response.status).toBe(201);
      expect(response.body).toEqual(
        expect.objectContaining({
          _id: todo.id,
          task: "Updated task",
        }),
      );
      expect((await Todo.findById(todo.id)).task).toBe("Updated task");
    });

    it("returns an error for an invalid todo id", async () => {
      const response = await request(app)
        .put("/api/todos/not-an-id")
        .send({ task: "Updated task" });

      expect(response.status).toBe(500);
      expect(response.body.message).toEqual(expect.any(String));
    });
  });

  describe("DELETE /api/todos/:id", () => {
    it("deletes the todo", async () => {
      const todo = await Todo.create({ task: "Remove this task" });

      const response = await request(app).delete(`/api/todos/${todo.id}`);

      expect(response.status).toBe(201);
      expect(response.body).toEqual({ message: "Deleted Successfully" });
      expect(await Todo.findById(todo.id)).toBeNull();
    });

    it("returns an error for an invalid todo id", async () => {
      const response = await request(app).delete("/api/todos/not-an-id");

      expect(response.status).toBe(500);
      expect(response.body.message).toEqual(expect.any(String));
    });
  });
});

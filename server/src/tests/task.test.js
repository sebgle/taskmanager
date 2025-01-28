const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const app = require("../index");
const Task = require("../models/taskModel");
const User = require("../models/userModel");
const jwt = require("jsonwebtoken");

jest.mock("../config/connectToDB", () => jest.fn());

process.env.JWT_SECRET = "test_secret";

let mongoServer;
let token;
let userId;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);

  const user = await User.create({
    name: "Test User",
    email: "test@example.com",
    password: "password123",
  });

  userId = user._id;
  token = `Bearer ${jwt.sign({ id: userId }, process.env.JWT_SECRET)}`;
});

beforeEach(async () => {
  await Task.deleteMany();
});

afterEach(async () => {
  await Task.deleteMany();
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe("Task CRUD Operations", () => {
  it("should create a new task successfully", async () => {
    const response = await request(app)
      .post("/task")
      .set("Authorization", token)
      .send({
        title: "Test Task",
        description: "This is a test task",
        status: "Pending",
        priority: "High",
        dueDate: new Date(),
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("success", true);
    expect(response.body.data).toHaveProperty("title", "Test Task");
  });

  it("should fail if required fields are missing", async () => {
    const response = await request(app)
      .post("/task")
      .set("Authorization", token)
      .send({});

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("error", "Task title is required");
  });

  it("should retrieve all tasks for the authenticated user", async () => {
    await Task.create([
      { title: "Task 1", userId },
      { title: "Task 2", userId },
    ]);

    const response = await request(app)
      .get("/task")
      .set("Authorization", token);

    expect(response.status).toBe(200);
    expect(response.body.data.length).toBe(2);
  });

  it("should retrieve a task by ID", async () => {
    const task = await Task.create({
      title: "Task by ID",
      description: "Retrieve this task",
      userId,
    });

    const response = await request(app)
      .get(`/task/${task._id}`)
      .set("Authorization", token);

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveProperty("title", "Task by ID");
  });

  it("should fail if a task ID is invalid", async () => {
    const response = await request(app)
      .get("/task/invalidTaskId")
      .set("Authorization", token);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("error", "Invalid task ID");
  });

  it("should update a task successfully", async () => {
    const task = await Task.create({
      title: "Old Task",
      description: "Update this task",
      userId,
    });

    const response = await request(app)
      .put(`/task/${task._id}`)
      .set("Authorization", token)
      .send({
        title: "Updated Task",
        status: "In Progress",
      });

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveProperty("title", "Updated Task");
  });

  it("should delete a task successfully", async () => {
    const task = await Task.create({ title: "Task to Delete", userId });

    const response = await request(app)
      .delete(`/task/${task._id}`)
      .set("Authorization", token);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("message", "Task deleted");
  });

  it("should fail to delete a task if it does not exist", async () => {
    const nonExistentId = new mongoose.Types.ObjectId();

    const response = await request(app)
      .delete(`/task/${nonExistentId}`)
      .set("Authorization", token);

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty("error", "Task not found");
  });

  it("should fail to update another user's task", async () => {
    const otherUserId = new mongoose.Types.ObjectId();
    const task = await Task.create({
      title: "Other User Task",
      userId: otherUserId,
    });

    const response = await request(app)
      .put(`/task/${task._id}`)
      .set("Authorization", token)
      .send({ title: "Unauthorized Update" });

    expect(response.status).toBe(403);
    expect(response.body).toHaveProperty("error", "Unauthorized action");
  });
});

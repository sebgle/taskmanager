const { MongoMemoryServer } = require("mongodb-memory-server");
const mongoose = require("mongoose");
const User = require("../models/userModel");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const testUri = process.env.DB_CONNECTION_STRING || mongoServer.getUri();
  await mongoose.connect(testUri);
});

beforeEach(async () => {
  await User.deleteMany({});
  await User.create({
    name: "Persistent User",
    email: "persistent@example.com",
    password: "hashedpassword123",
  });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe("User Model Test Suite", () => {
  test("Create a user successfully", async () => {
    const userData = {
      name: "Sebastian Le",
      email: "sebastian@example.com",
      password: "securepassword123",
    };

    const newUser = new User(userData);
    const savedUser = await newUser.save();

    expect(savedUser._id).toBeDefined();
    expect(savedUser.name).toBe(userData.name);
    expect(savedUser.email).toBe(userData.email);
    expect(savedUser.password).not.toBe(userData.password);
  });

  test("Fail to create a user without required fields", async () => {
    const invalidUser = new User({ email: "missingfields@example.com" });

    let error;
    try {
      await invalidUser.save();
    } catch (err) {
      error = err;
    }

    expect(error).toBeDefined();
    expect(error.errors.name).toBeDefined();
    expect(error.errors.password).toBeDefined();
  });

  test("Update a user", async () => {
    const userData = {
      name: "Old Name",
      email: "update@example.com",
      password: "securepassword123",
    };

    const user = new User(userData);
    const savedUser = await user.save();

    savedUser.name = "Updated Name";
    const updatedUser = await savedUser.save();

    expect(updatedUser.name).toBe("Updated Name");
  });

  test("Delete a user (but keep pre-inserted user)", async () => {
    const userData = {
      name: "Delete Me",
      email: "delete@example.com",
      password: "securepassword123",
    };

    const user = new User(userData);
    const savedUser = await user.save();

    await User.findByIdAndDelete(savedUser._id);

    const deletedUser = await User.findById(savedUser._id);
    expect(deletedUser).toBeNull();

    const persistentUser = await User.findOne({
      email: "persistent@example.com",
    });
    expect(persistentUser).not.toBeNull();
    expect(persistentUser.name).toBe("Persistent User");
  });
});

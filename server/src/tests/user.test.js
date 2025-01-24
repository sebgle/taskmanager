const request = require("supertest");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const { MongoMemoryServer } = require("mongodb-memory-server");
const app = require("../index");
const User = require("../models/userModel");
const bcrypt = require("bcrypt");

jest.mock("../config/connectToDB", () => jest.fn());

process.env.JWT_SECRET = "test_secret";
process.env.NODE_ENV = "test";

let mongoServer;
let token;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

beforeEach(async () => {
  await User.deleteMany();
});

afterEach(async () => {
  await User.deleteMany();
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe("User CRUD, Registration, Login, and Protected Routes", () => {
  describe("User Registration", () => {
    it("should register a new user successfully", async () => {
      const response = await request(app).post("/users/register").send({
        name: "Test User",
        email: "test@example.com",
        password: "password123",
      });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty(
        "message",
        "User registered successfully"
      );

      const user = await User.findOne({ email: "test@example.com" });
      expect(user).toBeTruthy();
      expect(user.name).toBe("Test User");
    });

    it("should fail for duplicate email with different case", async () => {
      await User.create({
        name: "Original User",
        email: "test@example.com",
        password: "password123",
      });

      const response = await request(app).post("/users/register").send({
        name: "Duplicate Email User",
        email: "TEST@example.com",
        password: "password123",
      });

      expect(response.status).toBe(409);
      expect(response.body).toHaveProperty("error", "Email already registered");
    });

    it("should ignore extra fields in the request", async () => {
      const response = await request(app).post("/users/register").send({
        name: "Extra Field User",
        email: "extrafields@example.com",
        password: "password123",
        extraField: "unexpected",
      });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty(
        "message",
        "User registered successfully"
      );

      const user = await User.findOne({ email: "extrafields@example.com" });
      expect(user).toBeTruthy();
      expect(user).not.toHaveProperty("extraField");
    });

    it("should fail if email is already registered", async () => {
      await User.create({
        name: "Existing User",
        email: "test@example.com",
        password: "password123",
      });

      const response = await request(app).post("/users/register").send({
        name: "New User",
        email: "test@example.com",
        password: "password456",
      });

      expect(response.status).toBe(409);
      expect(response.body).toHaveProperty("error", "Email already registered");
    });

    it("should fail if email format is invalid", async () => {
      const response = await request(app).post("/users/register").send({
        name: "Invalid Email",
        email: "invalidemail",
        password: "password123",
      });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error", "Invalid email format");
    });

    it("should fail if password is too short", async () => {
      const response = await request(app).post("/users/register").send({
        name: "Short Password",
        email: "shortpass@example.com",
        password: "123",
      });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty(
        "error",
        "Password must be at least 8 characters"
      );
    });

    it("should fail if required fields are missing", async () => {
      const response = await request(app).post("/users/register").send({
        email: "missingfields@example.com",
      });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error", "All fields are required");
    });
  });

  describe("User Login", () => {
    beforeEach(async () => {
      await User.create({
        name: "Test User",
        email: "test@example.com",
        password: "password123",
      });
    });

    it("should not allow SQL injection in login", async () => {
      const response = await request(app).post("/auth/login").send({
        email: "'; DROP TABLE users; --",
        password: "irrelevant",
      });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty(
        "error",
        "Invalid email or password"
      );
    });

    it("should fail with incorrect data types", async () => {
      const response = await request(app).post("/auth/login").send({
        email: 12345,
        password: true,
      });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error", "Invalid input format");
    });

    it("should login successfully with valid credentials", async () => {
      const response = await request(app).post("/auth/login").send({
        email: "test@example.com",
        password: "password123",
      });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("message", "Login successful");
      expect(response.body).toHaveProperty("token");

      token = response.body.token;
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      expect(decoded).toHaveProperty("userId");
    });

    it("should fail with invalid email", async () => {
      const response = await request(app).post("/auth/login").send({
        email: "invalid@example.com",
        password: "password123",
      });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty(
        "error",
        "Invalid email or password"
      );
    });

    it("should fail with invalid password", async () => {
      const response = await request(app).post("/auth/login").send({
        email: "test@example.com",
        password: "wrongpassword",
      });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty(
        "error",
        "Invalid email or password"
      );
    });

    it("should fail if email or password is missing", async () => {
      const response = await request(app).post("/auth/login").send({
        email: "test@example.com",
      });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty(
        "error",
        "Email and password are required"
      );
    });
  });

  describe("Protected Route Access", () => {
    beforeEach(async () => {
      await User.create({
        name: "Test User",
        email: "test@example.com",
        password: "password123",
      });

      const response = await request(app).post("/auth/login").send({
        email: "test@example.com",
        password: "password123",
      });
      token = response.body.token;
    });

    it("should deny access if token is missing 'Bearer' prefix", async () => {
      const response = await request(app)
        .get("/protected-route")
        .set("Authorization", token);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty("error", "Unauthorized");
    });

    it("should deny access with a malformed token", async () => {
      const response = await request(app)
        .get("/protected-route")
        .set("Authorization", "Bearer malformed.token");

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty("error", "Unauthorized");
    });

    it("should allow access with valid token", async () => {
      const response = await request(app)
        .get("/protected-route")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("message", "Access granted");
    });

    it("should deny access without token", async () => {
      const response = await request(app).get("/protected-route");

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty("error", "Unauthorized");
    });

    it("should deny access with invalid token", async () => {
      const response = await request(app)
        .get("/protected-route")
        .set("Authorization", "Bearer invalidToken");

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty("error", "Unauthorized");
    });

    it("should deny access if token is expired", async () => {
      const expiredToken = jwt.sign(
        { userId: "dummyUserId" },
        process.env.JWT_SECRET,
        { expiresIn: "1ms" }
      );

      await new Promise((resolve) => setTimeout(resolve, 10)); // Ensure the token has expired

      const response = await request(app)
        .get("/protected-route")
        .set("Authorization", `Bearer ${expiredToken}`);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty("error", "Unauthorized");
    });
  });

  describe("User CRUD Operations", () => {
    it("should create, update, and delete a user", async () => {
      const newUser = await User.create({
        name: "Create User",
        email: "create@example.com",
        password: "password123",
      });

      expect(newUser).toBeTruthy();
      expect(newUser.name).toBe("Create User");

      newUser.name = "Updated User";
      const updatedUser = await newUser.save();

      expect(updatedUser.name).toBe("Updated User");

      await User.findByIdAndDelete(updatedUser._id);
      const deletedUser = await User.findById(updatedUser._id);

      expect(deletedUser).toBeNull();
    });

    it("should fail to update a user with no fields provided", async () => {
      const newUser = await User.create({
        name: "Update User",
        email: "update@example.com",
        password: "password123",
      });

      const response = await request(app).put(`/users/${newUser._id}`).send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty(
        "error",
        "No fields provided for update"
      );
    });

    it("should fail to delete a non-existent user", async () => {
      const newUser = await User.create({
        name: "Delete User",
        email: "delete@example.com",
        password: "password123",
      });

      await User.findByIdAndDelete(newUser._id);

      const response = await request(app).delete(`/users/${newUser._id}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty("error", "User not found");
    });

    it("should handle errors when updating a non-existent user", async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .put(`/users/${nonExistentId}`)
        .send({ name: "Non-existent User" });

      // console.log("Test Response Status:", response.status);
      // console.log("Test Response Body:", response.body);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty("error", "User not found");
    });
  });

  describe("Get User by ID", () => {
    it("should fetch a user by ID successfully", async () => {
      const newUser = await User.create({
        name: "Test User",
        email: "testuser@example.com",
        password: "password123",
      });

      const response = await request(app).get(`/users/${newUser._id}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("name", "Test User");
      expect(response.body).toHaveProperty("email", "testuser@example.com");
      expect(response.body).not.toHaveProperty("password"); // Ensure password is excluded
    });

    it("should return 404 if user does not exist", async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const response = await request(app).get(`/users/${nonExistentId}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty("error", "User not found");
    });
  });
  describe("Get All Users", () => {
    it("should fetch all users successfully", async () => {
      await User.create([
        {
          name: "User One",
          email: "userone@example.com",
          password: "password123",
        },
        {
          name: "User Two",
          email: "usertwo@example.com",
          password: "password123",
        },
      ]);

      const response = await request(app).get("/users");

      expect(response.status).toBe(200);
      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBe(2);
      expect(response.body[0]).toHaveProperty("name", "User One");
      expect(response.body[1]).toHaveProperty("name", "User Two");
      expect(response.body[0]).not.toHaveProperty("password"); // Ensure password is excluded
      expect(response.body[1]).not.toHaveProperty("password"); // Ensure password is excluded
    });

    it("should return an empty array if no users exist", async () => {
      const response = await request(app).get("/users");

      expect(response.status).toBe(200);
      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBe(0);
    });
  });

  describe("User Update Function Tests", () => {
    let user;

    beforeEach(async () => {
      user = await User.create({
        name: "Test User",
        email: "test@example.com",
        password: await bcrypt.hash("password123", 10),
      });
    });

    it("should update the user's name successfully", async () => {
      const response = await request(app).put(`/users/${user._id}`).send({
        name: "Updated Name",
      });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty(
        "message",
        "User updated successfully"
      );
      expect(response.body.user).toHaveProperty("name", "Updated Name");
    });

    it("should fail if the user ID is invalid", async () => {
      const invalidId = "invalidId";
      const response = await request(app).put(`/users/${invalidId}`).send({
        name: "Updated Name",
      });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error", "Invalid user ID");
    });

    it("should fail if the user does not exist", async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const response = await request(app).put(`/users/${nonExistentId}`).send({
        name: "Updated Name",
      });

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty("error", "User not found");
    });

    it("should fail if no fields are provided for update", async () => {
      const response = await request(app).put(`/users/${user._id}`).send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty(
        "error",
        "No fields provided for update"
      );
    });

    it("should validate and fail for invalid email format", async () => {
      const response = await request(app).put(`/users/${user._id}`).send({
        email: "invalidemail",
      });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error", "Invalid email format");
    });

    it("should validate and fail for invalid name format", async () => {
      const response = await request(app).put(`/users/${user._id}`).send({
        name: "",
      });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty(
        "error",
        "Name must be at least 1 character"
      );
    });

    it("should update both name and email successfully", async () => {
      const response = await request(app).put(`/users/${user._id}`).send({
        name: "Updated Name",
        email: "updated@example.com",
      });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty(
        "message",
        "User updated successfully"
      );
      expect(response.body.user).toHaveProperty("name", "Updated Name");
      expect(response.body.user).toHaveProperty("email", "updated@example.com");
    });
  });

  describe("Additional User Tests", () => {
    describe("Email Normalization", () => {
      it("should trim leading and trailing whitespace in emails", async () => {
        const user = await User.create({
          name: "Original User",
          email: "test@example.com",
          password: "password123",
        });

        const response = await request(app).put(`/users/${user._id}`).send({
          email: "  TEST@example.com  ",
        });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty(
          "message",
          "User updated successfully"
        );
        expect(response.body.user).toHaveProperty("email", "test@example.com");

        const updatedUser = await User.findById(user._id);
        expect(updatedUser.email).toBe("test@example.com");
      });

      it("should not allow duplicate emails with whitespace differences", async () => {
        await User.create({
          name: "Original User",
          email: "test@example.com",
          password: "password123",
        });

        const user = await User.create({
          name: "Another User",
          email: "another@example.com",
          password: "password123",
        });

        const response = await request(app).put(`/users/${user._id}`).send({
          email: "  TEST@example.com  ",
        });

        expect(response.status).toBe(409);
        expect(response.body).toHaveProperty(
          "error",
          "Email already registered"
        );
      });
    });

    describe("Unique Name Handling", () => {
      it("should handle duplicate names gracefully", async () => {
        const user1 = await User.create({
          name: "Duplicate Name",
          email: "user1@example.com",
          password: "password123",
        });

        const user2 = await User.create({
          name: "Duplicate Name",
          email: "user2@example.com",
          password: "password123",
        });

        const response = await request(app).put(`/users/${user2._id}`).send({
          name: "Duplicate Name",
        });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty(
          "message",
          "User updated successfully"
        );
        expect(response.body.user).toHaveProperty("name", "Duplicate Name");
      });
    });

    describe("Case-Insensitive Uniqueness for Emails", () => {
      it("should ensure case-insensitive uniqueness for emails", async () => {
        await User.create({
          name: "Test User",
          email: "caseunique@example.com",
          password: "password123",
        });

        const user = await User.create({
          name: "Another User",
          email: "different@example.com",
          password: "password123",
        });

        const response = await request(app).put(`/users/${user._id}`).send({
          email: "CASEUNIQUE@example.com",
        });

        expect(response.status).toBe(409);
        expect(response.body).toHaveProperty(
          "error",
          "Email already registered"
        );
      });
    });

    describe("Password Handling", () => {
      it("should hash passwords correctly on update", async () => {
        const user = await User.create({
          name: "Test User",
          email: "test@example.com",
          password: "password123",
        });

        const response = await request(app).put(`/users/${user._id}`).send({
          password: "newpassword456",
        });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty(
          "message",
          "User updated successfully"
        );

        const updatedUser = await User.findById(user._id);
        const isPasswordMatch = await bcrypt.compare(
          "newpassword456",
          updatedUser.password
        );
        expect(isPasswordMatch).toBe(true);
      });

      it("should not reveal password hash in responses", async () => {
        const user = await User.create({
          name: "Test User",
          email: "test@example.com",
          password: "password123",
        });

        const response = await request(app).put(`/users/${user._id}`).send({
          password: "newpassword456",
        });

        expect(response.status).toBe(200);
        expect(response.body.user).not.toHaveProperty("password");
      });
    });

    describe("Invalid Field Inputs", () => {
      it("should fail if non-string name is provided", async () => {
        const user = await User.create({
          name: "Valid Name",
          email: "valid@example.com",
          password: "password123",
        });

        const response = await request(app).put(`/users/${user._id}`).send({
          name: 12345,
        });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty(
          "error",
          "Name must be at least 1 character"
        );
      });

      it("should fail if non-string email is provided", async () => {
        const user = await User.create({
          name: "Valid Name",
          email: "valid@example.com",
          password: "password123",
        });

        const response = await request(app).put(`/users/${user._id}`).send({
          email: 12345,
        });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty("error", "Invalid email format");
      });

      it("should fail if non-string password is provided", async () => {
        const user = await User.create({
          name: "Valid Name",
          email: "valid@example.com",
          password: "password123",
        });

        const response = await request(app).put(`/users/${user._id}`).send({
          password: 12345,
        });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty(
          "error",
          "Password must be at least 8 characters"
        );
      });
    });

    it("should handle non-existent but valid-looking IDs gracefully", async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const response = await request(app).put(`/users/${nonExistentId}`).send({
        name: "Updated Name",
      });

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty("error", "User not found");
    });
  });
});

const mongoose = require("mongoose");
const Task = require("../models/taskModel");

exports.createTask = async (req, res) => {
  try {
    const { title, description, status, priority, dueDate } = req.body;

    if (!title) {
      return res.status(400).json({ error: "Task title is required" });
    }

    const task = new Task({
      title,
      description,
      status,
      priority,
      dueDate,
      userId: req.user._id,
    });

    const savedTask = await task.save();
    res.status(201).json({ success: true, data: savedTask });
  } catch (error) {
    console.error("Error creating task:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.getTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ userId: req.user._id });
    res.status(200).json({ success: true, data: tasks });
  } catch (error) {
    console.error("Error retrieving tasks:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.getTaskById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Invalid task ID" });
    }

    const task = await Task.findById(req.params.id);

    if (!task || task.userId.toString() !== req.user._id.toString()) {
      return res.status(404).json({ error: "Task not found" });
    }

    res.status(200).json({ success: true, data: task });
  } catch (error) {
    console.error("Error retrieving task by ID:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.updateTask = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Invalid task ID" });
    }

    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    if (task.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Unauthorized action" });
    }

    Object.assign(task, req.body);
    const updatedTask = await task.save();
    res.status(200).json({ success: true, data: updatedTask });
  } catch (error) {
    console.error("Error updating task:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      console.error("Invalid task ID:", req.params.id);
      return res.status(400).json({ error: "Invalid task ID" });
    }

    const task = await Task.findById(req.params.id);

    if (!task || task.userId.toString() !== req.user._id.toString()) {
      console.error(
        "Task not found or unauthorized access:",
        req.params.id,
        req.user._id
      );
      return res.status(404).json({ error: "Task not found" });
    }

    await Task.deleteOne({ _id: task._id }); // Replace .remove() with .deleteOne()
    res.status(200).json({ success: true, message: "Task deleted" });
  } catch (error) {
    console.error("Error deleting task:", error);
    res.status(500).json({ error: error.message });
  }
};

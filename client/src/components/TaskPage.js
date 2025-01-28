import React, { useEffect, useState } from "react";
import { fetchTasks, createTask, updateTask, deleteTask } from "../api/taskApi";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";

const TaskPage = () => {
  const [tasks, setTasks] = useState([]);
  const [userName, setUserName] = useState("User");
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    priority: "Medium",
    dueDate: "",
  });
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const navigate = useNavigate();

  // Fetch the user's name from the token
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const decodedToken = jwtDecode(token);
      setUserName(decodedToken.name || "User"); // Assuming the token has a `name` field
    }
  }, []);

  // Fetch tasks on page load
  useEffect(() => {
    const getTasks = async () => {
      try {
        const response = await fetchTasks();
        setTasks(response.data.data);
      } catch (error) {
        console.error("Error fetching tasks:", error);
      }
    };
    getTasks();
  }, []);

  const handleAddTask = async () => {
    if (!newTask.title.trim()) {
      alert("Task title is required");
      return;
    }
    try {
      const response = await createTask({ ...newTask, status: "Pending" });
      setTasks([...tasks, response.data.data]);
      setNewTask({
        title: "",
        description: "",
        priority: "Medium",
        dueDate: "",
      });
      setIsAddingTask(false);
    } catch (error) {
      console.error("Error creating task:", error);
    }
  };

  const handleEditTask = async (id) => {
    try {
      const response = await updateTask(id, editingTask);
      const updatedTask = response.data.data;

      if (updatedTask.status === "Completed") {
        setTasks(tasks.filter((task) => task._id !== id));
      } else {
        setTasks(tasks.map((task) => (task._id === id ? updatedTask : task)));
      }

      setEditingTask(null);
    } catch (error) {
      console.error("Error updating task:", error);
    }
  };

  const handleDeleteTask = async (id) => {
    try {
      await deleteTask(id);
      setTasks(tasks.filter((task) => task._id !== id));
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto bg-white p-6 rounded shadow">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">Welcome, {userName}!</h2>
          <div className="flex space-x-4">
            <button
              onClick={handleLogout}
              className="bg-red-500 text-white py-2 px-4 rounded"
            >
              Logout
            </button>
            {!isAddingTask && (
              <button
                onClick={() => setIsAddingTask(true)}
                className="bg-blue-500 text-white py-2 px-4 rounded"
              >
                New Task
              </button>
            )}
          </div>
        </div>

        {isAddingTask && (
          <div className="mb-6">
            <h3 className="text-xl font-semibold mb-2">Add a New Task</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block mb-1">Title:</label>
                <input
                  type="text"
                  placeholder="Task Title"
                  value={newTask.title}
                  onChange={(e) =>
                    setNewTask({ ...newTask, title: e.target.value })
                  }
                  className="border p-2 rounded w-full"
                />
              </div>
              <div>
                <label className="block mb-1">Description:</label>
                <input
                  type="text"
                  placeholder="Task Description"
                  value={newTask.description}
                  onChange={(e) =>
                    setNewTask({ ...newTask, description: e.target.value })
                  }
                  className="border p-2 rounded w-full"
                />
              </div>
              <div>
                <label className="block mb-1">Priority:</label>
                <select
                  value={newTask.priority}
                  onChange={(e) =>
                    setNewTask({ ...newTask, priority: e.target.value })
                  }
                  className="border p-2 rounded w-full"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>
              <div>
                <label className="block mb-1">Due Date:</label>
                <input
                  type="date"
                  value={newTask.dueDate}
                  onChange={(e) =>
                    setNewTask({ ...newTask, dueDate: e.target.value })
                  }
                  className="border p-2 rounded w-full"
                />
              </div>
            </div>
            <button
              onClick={handleAddTask}
              className="mt-4 bg-green-500 text-white py-2 px-4 rounded"
            >
              Add Task
            </button>
            <button
              onClick={() => setIsAddingTask(false)}
              className="mt-4 ml-4 bg-red-500 text-white py-2 px-4 rounded"
            >
              Cancel
            </button>
          </div>
        )}

        <ul>
          {tasks.map((task) => (
            <li
              key={task._id}
              className="border-b py-4 flex justify-between items-center"
            >
              {editingTask?._id === task._id ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full items-center">
                  <input
                    type="text"
                    value={editingTask.title}
                    onChange={(e) =>
                      setEditingTask({ ...editingTask, title: e.target.value })
                    }
                    className="border p-2 rounded"
                  />
                  <input
                    type="text"
                    value={editingTask.description}
                    onChange={(e) =>
                      setEditingTask({
                        ...editingTask,
                        description: e.target.value,
                      })
                    }
                    className="border p-2 rounded"
                  />
                  <select
                    value={editingTask.priority}
                    onChange={(e) =>
                      setEditingTask({
                        ...editingTask,
                        priority: e.target.value,
                      })
                    }
                    className="border p-2 rounded"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                  <select
                    value={editingTask.status}
                    onChange={(e) =>
                      setEditingTask({
                        ...editingTask,
                        status: e.target.value,
                      })
                    }
                    className="border p-2 rounded"
                  >
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                  <input
                    type="date"
                    value={
                      editingTask.dueDate
                        ? editingTask.dueDate.split("T")[0]
                        : ""
                    }
                    onChange={(e) =>
                      setEditingTask({
                        ...editingTask,
                        dueDate: e.target.value,
                      })
                    }
                    className="border p-2 rounded"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditTask(task._id)}
                      className="bg-green-500 text-white py-1 px-3 rounded"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingTask(null)}
                      className="bg-red-500 text-white py-1 px-3 rounded"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <h4 className="font-bold">{task.title}</h4>
                  <p>{task.description}</p>
                  <p>Priority: {task.priority}</p>
                  <p>Status: {task.status}</p>
                  <p>
                    Due Date:{" "}
                    {task.dueDate ? task.dueDate.split("T")[0] : "N/A"}
                  </p>
                </div>
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => setEditingTask(task)}
                  className="bg-yellow-500 text-white py-1 px-3 rounded"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteTask(task._id)}
                  className="bg-red-500 text-white py-1 px-3 rounded"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default TaskPage;

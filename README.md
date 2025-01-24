# Collaborative Task Manager  
**By Sebastian Le**

## Updates  

### **1/22**  
- Set up the GitHub repository.  
- Created the basic folder structure.  
- Installed necessary dependencies.  
- Ran the server locally using Node.js.  
- Ran the React app in the browser.  

---

### **1/23**  
- Set up the MongoDB database.  
- Verified the database connection.  
- Created a user model for the database.  
- Tested CRUD operations and password hashing for the user model using **Jest** (automated testing).  
- Implemented the **registration (sign-up)** endpoint in the backend.  
- Implemented the **login** endpoint with authentication using **JWT**.  
- Implemented **protected route access** (controller + middleware).  

---

### **1/24**  
- Updated `userController.js` to ensure all tests passed.  
- Added routes for methods such as:  
  - **getAllUsers**  
  - **getUserByID**  
  - **deleteUser**  
  - **updateUser**  
- Performed additional testing on the user model with **Jest**.  
- Refer to `/tests/1.24.tests.png` for a full log of tested features.  

---

### **To-Do**  
- Add **profile picture (pfp)** and **bio** fields to the user model.  
- Continue testing the user model.  
- Add more routes for **user** and **auth** functionalities.  

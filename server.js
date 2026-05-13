const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const port = 3000;
const dbPath = path.join(__dirname, 'db.json');

// Helper to read DB
const readDB = async () => {
  try {
    const data = await fs.readFile(dbPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return { users: [], sessions: {} };
  }
};

// Helper to write DB
const writeDB = async (data) => {
  await fs.writeFile(dbPath, JSON.stringify(data, null, 2));
};

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('.')); // Serve static files from current directory

// Routes

// Get all users (for debugging)
app.get('/api/users', async (req, res) => {
  const db = await readDB();
  res.json(db.users);
});

// User registration
app.post('/api/register', async (req, res) => {
  const db = await readDB();
  const { name, username, password, age, height, weight, goal, description } = req.body;
  if (db.users.find(u => u.username === username)) {
    return res.status(400).json({ error: 'Username already exists' });
  }
  const newUser = {
    id: Date.now().toString(),
    name,
    username,
    password,
    age: parseInt(age),
    height: parseInt(height),
    weight: parseInt(weight),
    goal: parseInt(goal),
    description,
    calorieGoal: 2000, // default
    weightHistory: [],
    workouts: [],
    nutrition: [],
    todos: []
  };
  db.users.push(newUser);
  await writeDB(db);
  res.json({ message: 'User registered successfully' });
});

// User login
app.post('/api/login', async (req, res) => {
  const db = await readDB();
  const { username, password } = req.body;
  const user = db.users.find(u => u.username === username && u.password === password);
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const sessionId = Math.random().toString(36);
  db.sessions[sessionId] = user.id;
  await writeDB(db);
  res.json({ sessionId, user });
});

// Get user data
app.get('/api/user/:sessionId', async (req, res) => {
  const db = await readDB();
  const { sessionId } = req.params;
  const userId = db.sessions[sessionId];
  if (!userId) {
    return res.status(401).json({ error: 'Invalid session' });
  }
  const user = db.users.find(u => u.id === userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json(user);
});

// Update user profile
app.put('/api/user/:sessionId', async (req, res) => {
  const db = await readDB();
  const { sessionId } = req.params;
  const userId = db.sessions[sessionId];
  if (!userId) {
    return res.status(401).json({ error: 'Invalid session' });
  }
  const userIndex = db.users.findIndex(u => u.id === userId);
  if (userIndex === -1) {
    return res.status(404).json({ error: 'User not found' });
  }
  Object.assign(db.users[userIndex], req.body);
  await writeDB(db);
  res.json(db.users[userIndex]);
});

// Add workout
app.post('/api/user/:sessionId/workouts', async (req, res) => {
  const db = await readDB();
  const { sessionId } = req.params;
  const userId = db.sessions[sessionId];
  if (!userId) {
    return res.status(401).json({ error: 'Invalid session' });
  }
  const user = db.users.find(u => u.id === userId);
  const workout = { id: Date.now().toString(), ...req.body };
  user.workouts.push(workout);
  await writeDB(db);
  res.json(workout);
});

// Get workouts
app.get('/api/user/:sessionId/workouts', async (req, res) => {
  const db = await readDB();
  const { sessionId } = req.params;
  const userId = db.sessions[sessionId];
  if (!userId) {
    return res.status(401).json({ error: 'Invalid session' });
  }
  const user = db.users.find(u => u.id === userId);
  res.json(user.workouts);
});

// Update workout
app.put('/api/user/:sessionId/workouts/:id', async (req, res) => {
  const db = await readDB();
  const { sessionId, id } = req.params;
  const userId = db.sessions[sessionId];
  if (!userId) {
    return res.status(401).json({ error: 'Invalid session' });
  }
  const user = db.users.find(u => u.id === userId);
  const workoutIndex = user.workouts.findIndex(w => w.id === id);
  if (workoutIndex === -1) {
    return res.status(404).json({ error: 'Workout not found' });
  }
  Object.assign(user.workouts[workoutIndex], req.body);
  await writeDB(db);
  res.json(user.workouts[workoutIndex]);
});

// Delete workout
app.delete('/api/user/:sessionId/workouts/:id', async (req, res) => {
  const db = await readDB();
  const { sessionId, id } = req.params;
  const userId = db.sessions[sessionId];
  if (!userId) {
    return res.status(401).json({ error: 'Invalid session' });
  }
  const user = db.users.find(u => u.id === userId);
  user.workouts = user.workouts.filter(w => w.id !== id);
  await writeDB(db);
  res.json({ message: 'Workout deleted' });
});

// Similar for nutrition
app.post('/api/user/:sessionId/nutrition', async (req, res) => {
  const db = await readDB();
  const { sessionId } = req.params;
  const userId = db.sessions[sessionId];
  if (!userId) {
    return res.status(401).json({ error: 'Invalid session' });
  }
  const user = db.users.find(u => u.id === userId);
  const nutrition = { id: Date.now().toString(), ...req.body };
  user.nutrition.push(nutrition);
  await writeDB(db);
  res.json(nutrition);
});

app.get('/api/user/:sessionId/nutrition', async (req, res) => {
  const db = await readDB();
  const { sessionId } = req.params;
  const userId = db.sessions[sessionId];
  if (!userId) {
    return res.status(401).json({ error: 'Invalid session' });
  }
  const user = db.users.find(u => u.id === userId);
  res.json(user.nutrition);
});

app.put('/api/user/:sessionId/nutrition/:id', async (req, res) => {
  const db = await readDB();
  const { sessionId, id } = req.params;
  const userId = db.sessions[sessionId];
  if (!userId) {
    return res.status(401).json({ error: 'Invalid session' });
  }
  const user = db.users.find(u => u.id === userId);
  const nutritionIndex = user.nutrition.findIndex(n => n.id === id);
  if (nutritionIndex === -1) {
    return res.status(404).json({ error: 'Nutrition entry not found' });
  }
  Object.assign(user.nutrition[nutritionIndex], req.body);
  await writeDB(db);
  res.json(user.nutrition[nutritionIndex]);
});

app.delete('/api/user/:sessionId/nutrition/:id', async (req, res) => {
  const db = await readDB();
  const { sessionId, id } = req.params;
  const userId = db.sessions[sessionId];
  if (!userId) {
    return res.status(401).json({ error: 'Invalid session' });
  }
  const user = db.users.find(u => u.id === userId);
  user.nutrition = user.nutrition.filter(n => n.id !== id);
  await writeDB(db);
  res.json({ message: 'Nutrition entry deleted' });
});

// Logout
app.post('/api/logout/:sessionId', async (req, res) => {
  const db = await readDB();
  const { sessionId } = req.params;
  delete db.sessions[sessionId];
  await writeDB(db);
  res.json({ message: 'Logged out' });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3456;

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

// Path to activities storage file
const activitiesPath = path.join(__dirname, 'data', 'activities.json');

// Create data directory if it doesn't exist
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Helper function to read activities
function readActivities() {
  try {
    if (fs.existsSync(activitiesPath)) {
      const data = fs.readFileSync(activitiesPath, 'utf8');
      return JSON.parse(data);
    }
    return [];
  } catch (error) {
    console.error('Error reading activities:', error);
    return [];
  }
}

// Helper function to save activities
function saveActivities(activities) {
  try {
    fs.writeFileSync(activitiesPath, JSON.stringify(activities, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Error saving activities:', error);
    return false;
  }
}

// API endpoint to get all activities
app.get('/api/activities', (req, res) => {
  try {
    const activities = readActivities();
    res.json(activities);
  } catch (error) {
    console.error('Error reading activities:', error);
    res.status(500).json({ error: 'Failed to retrieve activities' });
  }
});

// API endpoint to add a new activity
app.post('/api/activities', (req, res) => {
  try {
    const activity = req.body;
    
    if (!activity || !activity.hash) {
      return res.status(400).json({ error: 'Invalid activity data' });
    }
    
    const activities = readActivities();
    
    // Check if activity with this hash already exists
    const existingIndex = activities.findIndex(a => a.hash === activity.hash);
    
    if (existingIndex >= 0) {
      // Update existing activity
      activities[existingIndex] = {
        ...activities[existingIndex],
        ...activity,
        updatedAt: Date.now()
      };
      console.log(`Updated activity: ${activity.hash}`);
    } else {
      // Add new activity
      activities.push({
        ...activity,
        createdAt: Date.now()
      });
      console.log(`Added new activity: ${activity.hash}`);
    }
    
    if (saveActivities(activities)) {
      res.status(existingIndex >= 0 ? 200 : 201).json({
        success: true,
        message: existingIndex >= 0 ? 'Activity updated' : 'Activity created'
      });
    } else {
      res.status(500).json({ error: 'Failed to save activity' });
    }
  } catch (error) {
    console.error('Error saving activity:', error);
    res.status(500).json({ error: 'Failed to save activity' });
  }
});

// API endpoint to get a specific activity by hash
app.get('/api/activities/:hash', (req, res) => {
  try {
    const { hash } = req.params;
    const activities = readActivities();
    const activity = activities.find(a => a.hash === hash);
    
    if (activity) {
      res.json(activity);
    } else {
      res.status(404).json({ error: 'Activity not found' });
    }
  } catch (error) {
    console.error('Error reading activity:', error);
    res.status(500).json({ error: 'Failed to retrieve activity' });
  }
});

// API endpoint to verify an NFT transaction
app.post('/api/verify', (req, res) => {
  const { hash } = req.body;
  
  if (!hash) {
    return res.status(400).json({ error: 'Transaction hash is required' });
  }
  
  // Simulate verification process
  setTimeout(() => {
    res.json({
      verified: true,
      hash,
      timestamp: Date.now()
    });
  }, 1000);
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Verification server running on port ${PORT}`);
}); 
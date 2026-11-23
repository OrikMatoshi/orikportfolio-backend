
const express = require("express");
const cors = require("cors");
const db = require("./db-old");

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Create projects table if it doesn't exist
db.prepare(`
  CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    image_url TEXT,
    technologies TEXT DEFAULT '[]',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`).run();

// Helper: convert database project to JSON
function formatProject(project) {
  return {
    ...project,
    technologies: JSON.parse(project.technologies || "[]")
  };
}

// Home route
app.get("/", (req, res) => {
  res.send("Orik Portfolio API is running!");
});

// =====================================
// GET ALL PROJECTS
// GET /api/projects
// =====================================
app.get("/api/projects", (req, res) => {
  try {
    const projects = db.prepare(`
      SELECT * FROM projects ORDER BY id DESC
    `).all();

    res.json(projects.map(formatProject));
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch projects." });
  }
});

// =====================================
// GET PROJECT BY ID
// GET /api/projects/:id
// =====================================
app.get("/api/projects/:id", (req, res) => {
  try {
    const project = db.prepare(`
      SELECT * FROM projects WHERE id = ?
    `).get(req.params.id);

    if (!project) {
      return res.status(404).json({
        error: "Project not found."
      });
    }

    res.json(formatProject(project));
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch project." });
  }
});

// =====================================
// CREATE PROJECT
// POST /api/projects
// =====================================
app.post("/api/projects", (req, res) => {
  try {
    const {
      title,
      description,
      image_url,
      technologies
    } = req.body;

    if (!title || !description) {
      return res.status(400).json({
        error: "Title and description are required."
      });
    }

    if (
      technologies !== undefined &&
      !Array.isArray(technologies)
    ) {
      return res.status(400).json({
        error: "Technologies must be an array."
      });
    }

    const insert = db.prepare(`
      INSERT INTO projects
      (title, description, image_url, technologies)
      VALUES (?, ?, ?, ?)
    `);

    const result = insert.run(
      title,
      description,
      image_url || "",
      JSON.stringify(technologies || [])
    );

    const newProject = db.prepare(`
      SELECT * FROM projects WHERE id = ?
    `).get(result.lastInsertRowid);

    res.status(201).json({
      success: true,
      message: "Project created successfully!",
      project: formatProject(newProject)
    });
 } catch (error) {
  console.error("CREATE PROJECT ERROR:", error);

  res.status(500).json({
    error: "Failed to create project.",
    details: error.message
  });
}
});

// =====================================
// UPDATE PROJECT
// PUT /api/projects/:id
// =====================================
app.put("/api/projects/:id", (req, res) => {
  try {
    const {
      title,
      description,
      image_url,
      technologies
    } = req.body;

    if (!title || !description) {
      return res.status(400).json({
        error: "Title and description are required."
      });
    }

    if (
      technologies !== undefined &&
      !Array.isArray(technologies)
    ) {
      return res.status(400).json({
        error: "Technologies must be an array."
      });
    }

    const existingProject = db.prepare(`
      SELECT * FROM projects WHERE id = ?
    `).get(req.params.id);

    if (!existingProject) {
      return res.status(404).json({
        error: "Project not found."
      });
    }

    db.prepare(`
      UPDATE projects
      SET title = ?,
          description = ?,
          image_url = ?,
          technologies = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      title,
      description,
      image_url || "",
      JSON.stringify(technologies || []),
      req.params.id
    );

    const updatedProject = db.prepare(`
      SELECT * FROM projects WHERE id = ?
    `).get(req.params.id);

    res.json({
      success: true,
      message: "Project updated successfully!",
      project: formatProject(updatedProject)
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to update project." });
  }
});

// =====================================
// DELETE PROJECT
// DELETE /api/projects/:id
// =====================================
app.delete("/api/projects/:id", (req, res) => {
  try {
    const result = db.prepare(`
      DELETE FROM projects WHERE id = ?
    `).run(req.params.id);

    if (result.changes === 0) {
      return res.status(404).json({
        error: "Project not found."
      });
    }

    res.json({
      success: true,
      message: "Project deleted successfully!"
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete project." });
  }
});

// =====================================
// CONTACT FORM
// POST /api/contact
// =====================================
app.post("/api/contact", (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({
        error: "Name, email and message are required."
      });
    }

    const insert = db.prepare(`
      INSERT INTO messages (name, email, subject, message)
      VALUES (?, ?, ?, ?)
    `);

    const result = insert.run(
      name,
      email,
      subject || "",
      message
    );

    res.status(201).json({
      success: true,
      message: "Message sent successfully!",
      id: result.lastInsertRowid
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to save contact message."
    });
  }
});

// Handle invalid JSON
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400) {
    return res.status(400).json({
      error: "Invalid JSON format."
    });
  }

  res.status(500).json({
    error: "Internal server error."
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Orik Portfolio server running on http://localhost:${PORT}`);
});

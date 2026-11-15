const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, "data", "notes.json");

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// ---------- helpers ----------

function readNotes() {
  if (!fs.existsSync(DATA_FILE)) {
    return [];
  }
  const text = fs.readFileSync(DATA_FILE, "utf-8");
  return text ? JSON.parse(text) : [];
}

function saveNotes(notes) {
  // make sure the data folder exists before writing
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(notes, null, 2));
}

// ---------- routes ----------

// get all notes, optional search with ?search=word
app.get("/api/notes", (req, res) => {
  let notes = readNotes();
  const search = req.query.search;

  if (search) {
    const word = search.toLowerCase();
    notes = notes.filter(
      (note) =>
        note.title.toLowerCase().includes(word) ||
        note.content.toLowerCase().includes(word)
    );
  }

  // show the latest edited notes first
  notes.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  res.json(notes);
});

// get one note
app.get("/api/notes/:id", (req, res) => {
  const note = readNotes().find((n) => n.id === req.params.id);
  if (!note) {
    return res.status(404).json({ error: "Note not found" });
  }
  res.json(note);
});

// create a note
app.post("/api/notes", (req, res) => {
  const { title, content } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({ error: "Title is required" });
  }

  const now = new Date().toISOString();
  const newNote = {
    id: Date.now().toString(),
    title: title.trim(),
    content: (content || "").trim(),
    createdAt: now,
    updatedAt: now,
  };

  const notes = readNotes();
  notes.push(newNote);
  saveNotes(notes);

  res.status(201).json(newNote);
});

// update a note
app.put("/api/notes/:id", (req, res) => {
  const { title, content } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({ error: "Title is required" });
  }

  const notes = readNotes();
  const note = notes.find((n) => n.id === req.params.id);
  if (!note) {
    return res.status(404).json({ error: "Note not found" });
  }

  note.title = title.trim();
  note.content = (content || "").trim();
  note.updatedAt = new Date().toISOString();
  saveNotes(notes);

  res.json(note);
});

// delete a note
app.delete("/api/notes/:id", (req, res) => {
  const notes = readNotes();
  const remaining = notes.filter((n) => n.id !== req.params.id);

  if (remaining.length === notes.length) {
    return res.status(404).json({ error: "Note not found" });
  }

  saveNotes(remaining);
  res.json({ message: "Note deleted" });
});

app.listen(PORT, () => {
  console.log(`Notes app running at http://localhost:${PORT}`);
});

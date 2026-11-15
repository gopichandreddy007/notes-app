const API_URL = "/api/notes";

const form = document.getElementById("note-form");
const titleInput = document.getElementById("title");
const contentInput = document.getElementById("content");
const saveBtn = document.getElementById("save-btn");
const cancelBtn = document.getElementById("cancel-btn");
const formHeading = document.getElementById("form-heading");
const errorText = document.getElementById("error");
const searchInput = document.getElementById("search");
const notesList = document.getElementById("notes-list");
const countText = document.getElementById("count");

// id of the note being edited (null means we are adding a new one)
let editingId = null;

// load notes from the server and show them
async function loadNotes() {
  const search = searchInput.value.trim();
  let url = API_URL;
  if (search) {
    url += "?search=" + encodeURIComponent(search);
  }

  try {
    const res = await fetch(url);
    const notes = await res.json();
    showNotes(notes);
  } catch (err) {
    notesList.innerHTML = '<p class="empty">Could not load notes. Is the server running?</p>';
  }
}

function showNotes(notes) {
  notesList.innerHTML = "";
  countText.textContent = notes.length + (notes.length === 1 ? " note" : " notes");

  if (notes.length === 0) {
    notesList.innerHTML = '<p class="empty">No notes yet. Add one above!</p>';
    return;
  }

  notes.forEach((note) => {
    const card = document.createElement("div");
    card.className = "note";

    // using textContent so html typed in a note is shown as text, not run
    const title = document.createElement("h3");
    title.textContent = note.title;

    const content = document.createElement("p");
    content.textContent = note.content;

    const date = document.createElement("small");
    date.textContent = "Updated: " + new Date(note.updatedAt).toLocaleString();

    const actions = document.createElement("div");
    actions.className = "actions";

    const editBtn = document.createElement("button");
    editBtn.textContent = "Edit";
    editBtn.addEventListener("click", () => startEdit(note));

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Delete";
    deleteBtn.className = "danger";
    deleteBtn.addEventListener("click", () => deleteNote(note.id));

    actions.append(editBtn, deleteBtn);
    card.append(title, content, date, actions);
    notesList.appendChild(card);
  });
}

// add or update a note when the form is submitted
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  errorText.textContent = "";

  const noteData = {
    title: titleInput.value,
    content: contentInput.value,
  };

  if (!noteData.title.trim()) {
    errorText.textContent = "Please enter a title.";
    return;
  }

  const url = editingId ? API_URL + "/" + editingId : API_URL;
  const method = editingId ? "PUT" : "POST";

  const res = await fetch(url, {
    method: method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(noteData),
  });

  if (!res.ok) {
    const data = await res.json();
    errorText.textContent = data.error || "Something went wrong.";
    return;
  }

  resetForm();
  loadNotes();
});

function startEdit(note) {
  editingId = note.id;
  titleInput.value = note.title;
  contentInput.value = note.content;
  formHeading.textContent = "Edit note";
  saveBtn.textContent = "Update Note";
  cancelBtn.classList.remove("hidden");
  window.scrollTo({ top: 0, behavior: "smooth" });
  titleInput.focus();
}

function resetForm() {
  editingId = null;
  form.reset();
  errorText.textContent = "";
  formHeading.textContent = "Add a new note";
  saveBtn.textContent = "Add Note";
  cancelBtn.classList.add("hidden");
}

async function deleteNote(id) {
  if (!confirm("Delete this note?")) {
    return;
  }

  await fetch(API_URL + "/" + id, { method: "DELETE" });

  // if we deleted the note we were editing, clear the form
  if (id === editingId) {
    resetForm();
  }
  loadNotes();
}

cancelBtn.addEventListener("click", resetForm);

// search as the user types (small delay so we don't call the api on every key)
let searchTimer;
searchInput.addEventListener("input", () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(loadNotes, 300);
});

loadNotes();

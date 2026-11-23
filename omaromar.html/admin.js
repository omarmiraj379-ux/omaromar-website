import { auth, db } from "./firebase.js";

import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

// Administrator UID
const ADMIN_UID = "cbsIjD78cHSRK21cTERvU8e6xi23";

// HTML elements
const loginPanel = document.getElementById("loginPanel");
const dashboardPanel = document.getElementById("dashboardPanel");

const loginForm = document.getElementById("loginForm");
const loginStatus = document.getElementById("loginStatus");

const courseForm = document.getElementById("courseForm");
const courseStatus = document.getElementById("courseStatus");
const courseList = document.getElementById("courseList");

const titleInput = document.getElementById("courseTitle");
const descriptionInput = document.getElementById("courseDescription");
const youtubeInput = document.getElementById("youtubeUrl");
const publishedInput = document.getElementById("published");

let editingCourseId = null;
let stopListening = null;

// Convert YouTube URL into video ID
function extractYouTubeId(value) {
  try {
    const url = new URL(value);
    let id = "";

    if (url.hostname === "youtu.be") {
      id = url.pathname.slice(1);
    } else if (
      ["youtube.com", "www.youtube.com", "m.youtube.com"].includes(url.hostname)
    ) {
      if (url.pathname === "/watch") {
        id = url.searchParams.get("v") || "";
      } else {
        const parts = url.pathname.split("/");

        if (["embed", "shorts"].includes(parts[1])) {
          id = parts[2] || "";
        }
      }
    }

    return /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;

  } catch {
    return null;
  }
}

// Administrator login
loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  loginStatus.textContent = "Signing in...";

  const email = document.getElementById("adminEmail").value.trim();
  const password = document.getElementById("adminPassword").value;

  try {
    await signInWithEmailAndPassword(auth, email, password);
    loginStatus.textContent = "Login successful. Checking administrator access...";

  } catch (error) {
    loginStatus.textContent = "Login failed: " + error.message;
  }
});
// FORGOT PASSWORD
document.getElementById("resetPasswordButton").addEventListener("click", async () => {
  const email = document.getElementById("adminEmail").value.trim();

  if (!email) {
    loginStatus.textContent = "Please enter your administrator email first.";
    return;
  }

  try {
    await sendPasswordResetEmail(auth, email);
    loginStatus.textContent = "Password reset email sent. Check your Gmail inbox.";
  } catch (error) {
    loginStatus.textContent = "Error: " + error.message;
  }
});
// Check administrator account
onAuthStateChanged(auth, (user) => {

  if (user && user.uid === ADMIN_UID) {

    loginPanel.classList.add("hidden");
    dashboardPanel.classList.remove("hidden");

    document.getElementById("adminEmailDisplay").textContent =
      "Signed in as: " + user.email;

    listenForCourses();

  } else {

    dashboardPanel.classList.add("hidden");
    loginPanel.classList.remove("hidden");

    if (user) {
      loginStatus.textContent =
        "Access denied. This account is not an administrator.";

      signOut(auth);
    }

    if (stopListening) {
      stopListening();
      stopListening = null;
    }
  }
});

// Add or update a lesson
courseForm.addEventListener("submit", async (event) => {

  event.preventDefault();

  const title = titleInput.value.trim();
  const description = descriptionInput.value.trim();
  const youtubeId = extractYouTubeId(youtubeInput.value.trim());

  if (!youtubeId) {
    courseStatus.textContent = "Please enter a valid YouTube video link.";
    return;
  }

  const courseData = {
    title,
    description,
    youtubeId,
    published: publishedInput.checked
  };

  courseStatus.textContent = "Saving lesson...";

  try {

    if (editingCourseId) {

      await updateDoc(doc(db, "courses", editingCourseId), courseData);

      courseStatus.textContent = "Lesson updated successfully!";

    } else {

      await addDoc(collection(db, "courses"), {
        ...courseData,
        createdAt: serverTimestamp()
      });

      courseStatus.textContent = "Lesson saved successfully!";
    }

    resetCourseForm();

  } catch (error) {
    courseStatus.textContent = "Error: " + error.message;
  }
});

// Display lessons from Firestore
function listenForCourses() {

  if (stopListening) stopListening();

  const coursesQuery = query(
    collection(db, "courses"),
    orderBy("createdAt", "desc")
  );

  stopListening = onSnapshot(coursesQuery, (snapshot) => {

    courseList.replaceChildren();

    if (snapshot.empty) {
      courseList.textContent = "No lessons added yet.";
      return;
    }

    snapshot.forEach((courseDocument) => {

      const course = courseDocument.data();
      const id = courseDocument.id;

      const card = document.createElement("div");
      card.className = "course";

      const heading = document.createElement("h3");
      heading.textContent = course.title || "Untitled lesson";

      const description = document.createElement("p");
      description.textContent = course.description || "";

      const status = document.createElement("p");
      status.textContent = course.published ? "Published" : "Not published";
      status.className = course.published ? "published" : "unpublished";

      const video = document.createElement("p");
      video.textContent = "YouTube video ID: " + (course.youtubeId || "");

      const editButton = document.createElement("button");
      editButton.textContent = "Edit";

      editButton.addEventListener("click", () => {

        editingCourseId = id;

        titleInput.value = course.title || "";
        descriptionInput.value = course.description || "";

        youtubeInput.value = course.youtubeId
          ? "https://www.youtube.com/watch?v=" + course.youtubeId
          : "";

        publishedInput.checked = course.published === true;

        document.getElementById("courseFormTitle").textContent = "Edit Lesson";
        document.getElementById("saveCourseButton").textContent = "Update Lesson";
        document.getElementById("cancelEditButton").classList.remove("hidden");

        courseForm.scrollIntoView({ behavior: "smooth" });
      });

      const deleteButton = document.createElement("button");
      deleteButton.textContent = "Delete";
      deleteButton.className = "danger";

      deleteButton.addEventListener("click", async () => {

        if (!confirm("Are you sure you want to delete this lesson?")) return;

        try {
          await deleteDoc(doc(db, "courses", id));
          courseStatus.textContent = "Lesson deleted.";

        } catch (error) {
          courseStatus.textContent = "Delete failed: " + error.message;
        }
      });

      card.append(
        heading,
        description,
        status,
        video,
        editButton,
        deleteButton
      );

      courseList.appendChild(card);
    });

  }, (error) => {
    courseList.textContent = "Could not load lessons: " + error.message;
  });
}

// Reset lesson form
function resetCourseForm() {

  courseForm.reset();

  publishedInput.checked = true;
  editingCourseId = null;

  document.getElementById("courseFormTitle").textContent = "Add a New Lesson";
  document.getElementById("saveCourseButton").textContent = "Publish Lesson";
  document.getElementById("cancelEditButton").classList.add("hidden");
}

// Cancel editing
document.getElementById("cancelEditButton")
  .addEventListener("click", resetCourseForm);

// Logout
document.getElementById("logoutButton")
  .addEventListener("click", async () => {
    await signOut(auth);
  });

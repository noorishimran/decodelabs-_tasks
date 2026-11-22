
"use strict";

// Mobile Navigation
const menuBtn = document.querySelector("#menu-btn");
const navLinks = document.querySelector(".nav-links");

menuBtn.addEventListener("click", () => {
  const open = navLinks.classList.toggle("active");
  menuBtn.textContent = open ? "✕" : "☰";
  menuBtn.setAttribute("aria-expanded", String(open));
});

document.querySelectorAll(".nav-links a").forEach(link => {
  link.addEventListener("click", () => {
    navLinks.classList.remove("active");
    menuBtn.textContent = "☰";
    menuBtn.setAttribute("aria-expanded", "false");
  });
});

// Backend Connection
const API = "http://localhost:3000";
const courseContainer = document.querySelector(".course-container");
const enrolledButtons = new Map();

// Create Professional Enrollment Modal
const dialog = document.createElement("dialog");
dialog.className = "enrollment-dialog";

dialog.innerHTML = `
  <div class="enrollment-panel">
    <div class="enrollment-banner">
      <button class="dialog-close" type="button"
        aria-label="Close form">✕</button>
      <span class="form-eyebrow">SKILLHUB • STUDENT PORTAL</span>
      <h2>Start your learning journey</h2>
      <p>Choose your course and complete your enrollment.</p>
    </div>

    <div class="enrollment-content">
      <div id="enrollFormArea">
        <div class="form-step">
          <span>ENROLLMENT FORM</span>
          <span>Student Details</span>
        </div>

        <form id="enrollForm">
          <label for="studentName">Full Name *</label>
          <input id="studentName"
                 name="studentName"
                 type="text"
                 autocomplete="name"
                 minlength="2"
                 maxlength="60"
                 placeholder="Enter your full name"
                 required>

          <label for="courseChoice">Choose Course *</label>
          <select id="courseChoice"
                  name="courseChoice" required></select>

          <label for="studentLevel">Experience Level *</label>
          <select id="studentLevel"
                  name="studentLevel" required>
            <option value="">Select your level</option>
            <option value="Beginner">Beginner - Just starting</option>
            <option value="Intermediate">Intermediate - Know the basics</option>
            <option value="Advanced">Advanced - Improving skills</option>
          </select>

          <label for="learningGoal">Learning Goal (Optional)</label>
          <textarea id="learningGoal"
                    name="learningGoal"
                    maxlength="160"
                    rows="2"
                    placeholder="What do you want to achieve?"></textarea>

          <label class="check-row">
            <input id="demoConfirm"
                   type="checkbox" required>
            <span>I understand this is a demo enrollment.</span>
          </label>

          <p id="formError"
             class="form-error"
             role="alert" hidden></p>

          <button id="submitEnrollment"
                  class="submit-enrollment"
                  type="submit">
            Confirm Enrollment →
          </button>

          <p class="form-hint">
            No payment required • Demo project
          </p>
        </form>
      </div>

      <div id="enrollSuccess"
           class="enroll-success"
           hidden role="status">
        <div class="success-icon">✓</div>
        <h3>You're enrolled!</h3>
        <p id="successSummary"></p>
        <button id="successDone"
                class="submit-enrollment"
                type="button">
          Back to Courses
        </button>
      </div>
    </div>
  </div>
`;

document.body.append(dialog);

const form = dialog.querySelector("#enrollForm");
const formArea = dialog.querySelector("#enrollFormArea");
const successArea = dialog.querySelector("#enrollSuccess");
const courseChoice = dialog.querySelector("#courseChoice");
const formError = dialog.querySelector("#formError");
const submitBtn = dialog.querySelector("#submitEnrollment");

let previousFocus = null;

// Open enrollment form
function openEnrollment(courseId) {
  previousFocus = document.activeElement;
  form.reset();

  formError.hidden = true;
  formArea.hidden = false;
  successArea.hidden = true;

  courseChoice.value = String(courseId);
  dialog.showModal();
  dialog.querySelector("#studentName").focus();
}

// Close form
dialog.querySelector(".dialog-close")
  .addEventListener("click", () => dialog.close());

dialog.querySelector("#successDone")
  .addEventListener("click", () => dialog.close());

dialog.addEventListener("close", () => {
  if (previousFocus) previousFocus.focus();
});

dialog.addEventListener("click", event => {
  if (event.target === dialog) dialog.close();
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    navLinks.classList.remove("active");
    menuBtn.textContent = "☰";
    menuBtn.setAttribute("aria-expanded", "false");
  }
});

// Submit enrollment to Backend API
form.addEventListener("submit", async event => {
  event.preventDefault();

  const studentName = dialog.querySelector("#studentName").value.trim();
  const courseId = Number(courseChoice.value);
  const level = dialog.querySelector("#studentLevel").value;
  const goal = dialog.querySelector("#learningGoal").value.trim();

  if (studentName.length < 2 || studentName.length > 60) {
    formError.textContent = "Name must be 2 to 60 characters.";
    formError.hidden = false;
    return;
  }

  formError.hidden = true;
  submitBtn.disabled = true;
  submitBtn.textContent = "Submitting...";

  try {
    const response = await fetch(`${API}/api/enrollments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        studentName,
        courseId,
        level,
        goal
      })
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Enrollment failed");
    }

    const button = enrolledButtons.get(courseId);

    if (button) {
      button.textContent = "Enrolled ✓";
      button.setAttribute("aria-pressed", "true");
    }

    const selectedTitle =
      courseChoice.selectedOptions[0].textContent;

    dialog.querySelector("#successSummary").textContent =
      `${studentName}, your enrollment in ${selectedTitle} is confirmed. Enrollment ID: ${result.enrollment.id}.`;

    formArea.hidden = true;
    successArea.hidden = false;

  } catch (error) {
    formError.textContent = error.message === "Failed to fetch"
      ? "Backend not reachable. Run npm start and try again."
      : error.message;

    formError.hidden = false;

  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Confirm Enrollment →";
  }
});

// Load Courses from Backend
async function loadCourses() {
  try {
    const response = await fetch(`${API}/api/courses`);

    if (!response.ok) {
      throw new Error("Could not load courses");
    }

    const data = await response.json();

    courseContainer.replaceChildren();
    courseChoice.replaceChildren();

    data.courses.forEach(course => {
      const option = document.createElement("option");
      option.value = String(course.id);
      option.textContent = course.title;
      courseChoice.append(option);

      const card = document.createElement("article");
      card.className = "course-card";

      const heading = document.createElement("h3");
      heading.textContent = course.title;

      const description = document.createElement("p");
      description.textContent = course.description;

      const button = document.createElement("button");
      button.type = "button";
      button.className = "enroll-btn";
      button.textContent = "Enroll Now →";
      button.setAttribute("aria-pressed", "false");

      button.addEventListener("click", () => {
        openEnrollment(course.id);
      });

      card.append(heading, description, button);
      courseContainer.append(card);
      enrolledButtons.set(course.id, button);
    });

  } catch (error) {
    courseContainer.textContent =
      "Unable to load courses. Start backend with npm start.";

    console.error("Backend error:", error);
  }
}

loadCourses();

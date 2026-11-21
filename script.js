
"use strict";

// Mobile Navigation Menu
const menuBtn = document.getElementById("menu-btn");
const navLinks = document.querySelector(".nav-links");

menuBtn.addEventListener("click", function () {
    const isOpen = navLinks.classList.toggle("active");

    menuBtn.setAttribute("aria-expanded", String(isOpen));
    menuBtn.textContent = isOpen ? "✕" : "☰";
});

// Close menu when a navigation link is clicked
document.querySelectorAll(".nav-links a").forEach(function (link) {
    link.addEventListener("click", function () {
        navLinks.classList.remove("active");
        menuBtn.setAttribute("aria-expanded", "false");
        menuBtn.textContent = "☰";
    });
});

// Close mobile menu when Escape is pressed
document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
        navLinks.classList.remove("active");
        menuBtn.setAttribute("aria-expanded", "false");
        menuBtn.textContent = "☰";
    }
});

// Load previously enrolled courses
let enrolledCourses = [];

try {
    enrolledCourses = JSON.parse(
        localStorage.getItem("skillhubCourses") || "[]"
    );

    if (!Array.isArray(enrolledCourses)) {
        enrolledCourses = [];
    }
} catch (error) {
    enrolledCourses = [];
}

// Course Enrollment Functionality
document.querySelectorAll(".course-card").forEach(function (card) {
    const courseName = card.querySelector("h3").textContent.trim();
    const button = card.querySelector(".enroll-btn");

    function updateButton() {
        const enrolled = enrolledCourses.includes(courseName);

        button.textContent = enrolled ? "Enrolled ✓" : "Enroll Now";
        button.setAttribute("aria-pressed", String(enrolled));
    }

    updateButton();

    button.addEventListener("click", function () {
        if (enrolledCourses.includes(courseName)) {
            enrolledCourses = enrolledCourses.filter(
                course => course !== courseName
            );
        } else {
            enrolledCourses.push(courseName);
        }

        try {
            localStorage.setItem(
                "skillhubCourses",
                JSON.stringify(enrolledCourses)
            );
        } catch (error) {
            console.warn("Could not save enrollment locally.");
        }

        updateButton();
    });
});

console.log("SkillHub website loaded successfully!");

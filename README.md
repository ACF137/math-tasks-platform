# Math Tasks Platform

Math Tasks Platform is a lightweight, interactive web application for learning and practicing mathematics, built with **TypeScript**, **Vite**, **math.js**, and **Node.js**. Teachers can create and manage assignments, while students solve randomly selected problems, check their answers, and review explanations.

## Features

* **Random Math Tasks:** Practice exercises in a randomized order without immediate repeats
* **Instant Answer Checking:** Get feedback after submitting an answer
* **Step-by-Step Explanations:** Review the correct answer and a teacher-provided solution
* **Teacher Dashboard:** Create, view, and delete assignments in a password-protected interface
* **Image Support:** Attach images to questions and solutions
* **Smart Answer Matching:** Support fractions, decimal commas, and multiple answers in any order
* **Math Calculator:** Evaluate mathematical expressions with `math.js`
* **Equation Solver:** Solve quadratic equations and view the discriminant calculation
* **Derivative Calculator:** Find symbolic derivatives of functions
* **Practice Statistics:** Track correct answers during the current practice session
* **Dual Storage Modes:** Run as a shared Node.js server or a standalone browser demo

## Core UI Controls

* **Tasks** — Solve randomly selected math problems and submit answers
* **Calculator** — Switch between expressions, quadratic equations, and derivatives
* **Teacher** — Sign in to create and manage assignments
* **Submit Answer** — Check the current solution
* **Show Solution** — Reveal the explanation after a correct answer
* **Next Task** — Continue to another exercise

## Math Tools

The built-in calculator provides three modes:

* **Expression:** Evaluate expressions such as `2*(3+4)^2 / sqrt(16)`
* **Quadratic Equation:** Solve equations in the form `ax² + bx + c = 0`, including complex roots
* **Derivative:** Differentiate functions such as `x^3 + sin(x)`

The calculator also displays a history of the last **10 calculations** during the current session.

## Teacher & Student Modes

Teachers can add problems as text or images, specify the correct answer, and provide a written or illustrated explanation. They can also view and delete existing assignments.

Students receive random assignments and enter their answers. After submission, the application displays whether the answer is correct. Incorrect answers reveal the correct answer and explanation; for correct answers, students can optionally show the explanation.

The server keeps teacher management endpoints behind password authentication.

## Requirements

* A modern web browser
* **Node.js 18+** for server mode
* **npm** for building or developing from source

The included prebuilt server and `dist/index.html` can run without installing npm dependencies.

## Installation & Setup

Choose **one** of the following methods.

### Method 1: Standalone Browser Demo

Open `dist/index.html` in your browser.

* No server required
* Demo teacher password: `1234`
* Assignments are stored locally in that browser
* Changes are **not shared** with other students or devices
* Suitable for testing and offline demonstrations

### Method 2: Shared Node.js Server

To build the latest version from source, run:

```bash
npm install
npm run build
```

Then set a teacher password and start the server:

**macOS / Linux:**

```bash
TEACHER_PASSWORD=your-secure-password npm start
```

**Windows (PowerShell):**

```powershell
$env:TEACHER_PASSWORD="your-secure-password"
npm start
```

Open the application at:

`http://localhost:3000`

Students on the same local network can use:

`http://YOUR-LOCAL-IP:3000`

If you are using the provided prebuilt files, you can start the server directly with `node server/server.mjs` after setting `TEACHER_PASSWORD`.

## Configuration & Data Storage

* **`TEACHER_PASSWORD`** — Sets the teacher login password in server mode. Set your own password before sharing the server.
* **`PORT`** — Changes the server port (default: `3000`).
* **`DATA_DIR`** — Changes the directory where shared assignments and images are saved (default: `data/`).

Server assignments are stored in `data/tasks.json`, and uploaded images are stored in `data/img/`. Back up the `data/` directory to preserve assignments. On cloud hosting, use persistent storage.

For internet-facing deployment, use **HTTPS** to protect the teacher password and session tokens in transit.

## Development

```bash
npm install
npm run dev       # Start the Vite development server (browser-local mode)
npm run build     # Build the frontend and server-side answer checker
npm start         # Start the Node.js server
npm run preview   # Preview the production frontend
```

The interface is currently in Russian.

## Changelog

### v0.4.0

* Teacher dashboard with assignment creation and deletion
* Randomized student practice with answer checking and explanations
* Support for text and image-based problems
* Expression, quadratic equation, and derivative calculators
* Browser-only demo and shared Node.js server modes

## Version

Current version: `v0.4.0`

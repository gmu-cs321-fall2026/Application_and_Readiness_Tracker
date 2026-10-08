# AI Prompt Log

## Setup 

### 2026-09-17 — Docker Setup

**Asked:**  
I asked ChatGPT to help create the minimum Docker setup needed for the Application & Readiness Tracker subsystem using Python and FastAPI so that the Dockerfile would build and run.

**Produced:**  
ChatGPT provided a Dockerfile using Python 3.12, a requirements.txt file with FastAPI and Uvicorn, and a minimal FastAPI application in app/main.py that could be started by the Docker container.

**Changed or rejected:**  
I kept the Dockerfile and dependency setup after testing the Docker build. 
Process: The initial Docker image built successfully, but the container did not run because main.py did not yet contain the FastAPI app object that Uvicorn was configured to start. I added a minimal FastAPI application with app = FastAPI() and a basic root endpoint. I then rebuilt the image and ran the container again. The application started successfully on port 8000, confirming that the Docker setup could build and run.



### September 17, 2026

**AI Tool:** ChatGPT

**Use:** I worked on the architecture documentation and component sketch for Subsystem 2. I used ChatGPT for assistance with understanding the Week 4 requirements, checking my understanding of the Layered Architecture pattern, and organizing my ideas for the documentation and component sketch.

**Prompt:** "Can you help me understand the Week 4 software architecture requirements and check if my Layered Architecture choice and component sketch cover what is required?"

### 2026-10-08 — Migrating Docker Setup from Python to Java

**Asked:**

After switching our project from Python/FastAPI to Java, I asked ChatGPT to review the existing Dockerfile, requirements.txt, and app/main/main.java files. I wanted to understand which files needed to be updated or removed, whether the existing Application Tracker Main.java could serve as the entry point, and how to update the Docker setup to run the Java application.

**Produced:**

ChatGPT suggested:

- Replacing the Python 3.12 Docker image with Eclipse Temurin Java 17 JDK.
- Removing the Python dependency installation steps from the Dockerfile.
- Copying the Java source files from `app/applicationtracker/` into the container.
- Compiling the Java files using `javac`.
- Running the application using `java -cp out Main`.
- Removing `requirements.txt` and the old FastAPI placeholder in `app/main/main.java` if no other team components depend on them.
- Updating the README with Java compilation and Docker execution instructions.

**Changed or rejected:**

- Kept the existing four Java Application Tracker files rather than creating another Java entry point.
- Selected Java 17 for the Docker environment to match the current Java implementation.
- Removed the Python-specific Docker configuration because the project no longer uses FastAPI.
- Kept the Docker setup focused on the current console application instead of adding an unsupported web server or API.
- Preserved other team files until their purpose and dependencies could be confirmed.


## Application Tracker — AI Prompt Log

### 1. ApplicationStatus.java

**Asked:** Asked ChatGPT to improve the application statuses to support the job application pipeline.

**Produced:** An enum containing PLANNED, IN_PROGRESS, APPLIED, ONLINE_ASSESSMENT, PHONE_SCREEN, INTERVIEW, OFFER, ACCEPTED, REJECTED, and WITHDRAWN.

**Changed or rejected:** Expanded the original two statuses to include the additional application stages required by the project. Kept the three main sections (Plan to Apply, In Progress, Applied) for the initial tracker.

### 2. Application.java

**Asked:** Asked ChatGPT to refine the application data model, add validation, and explain the code through comments.

**Produced:** An Application class containing employer name, role title, application date, source, deadline, notes, unique ID, and status.

**Changed or rejected:** Expanded the original data model to include source, deadline, and notes. Kept the required-field validation and added unique IDs to distinguish applications. Database storage was deferred until backend integration.

### 3. ApplicationTracker.java

**Asked:** Asked ChatGPT to improve application creation, status transitions, notes, and application filtering.

**Produced:** Methods for creating applications, finding applications by ID, validating status transitions, updating notes, and organizing applications by status.

**Changed or rejected:** Replaced unrestricted status changes with validation to prevent invalid transitions. Kept the three-section tracker design to match the Jira user story. Advanced interview-round functionality was deferred.

### 4. Main.java

**Asked:** Asked ChatGPT to improve the console interface so users can manage multiple applications.

**Produced:** A menu-driven program that allows users to add applications, view applications, update statuses, and add notes.

**Changed or rejected:** Replaced the original single-application interaction with a repeating menu. Kept the console interface for testing the application logic before implementing the web UI.
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
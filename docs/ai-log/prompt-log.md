# AI Prompt Log

## 2026-09-17 — Docker Setup

**Asked:**  
I asked ChatGPT to help create the minimum Docker setup needed for the Application & Readiness Tracker subsystem using Python and FastAPI so that the Dockerfile would build and run.

**Produced:**  
ChatGPT provided a Dockerfile using Python 3.12, a requirements.txt file with FastAPI and Uvicorn, and a minimal FastAPI application in app/main.py that could be started by the Docker container.

**Changed or rejected:**  
I kept the Dockerfile and dependency setup after testing the Docker build. 
Process: The initial Docker image built successfully, but the container did not run because main.py did not yet contain the FastAPI app object that Uvicorn was configured to start. I added a minimal FastAPI application with app = FastAPI() and a basic root endpoint. I then rebuilt the image and ran the container again. The application started successfully on port 8000, confirming that the Docker setup could build and run.



## September 17, 2026

**AI Tool:** ChatGPT

**Use:** I worked on the architecture documentation and component sketch for Subsystem 2. I used ChatGPT for assistance with understanding the Week 4 requirements, checking my understanding of the Layered Architecture pattern, and organizing my ideas for the documentation and component sketch.

**Prompt:** "Can you help me understand the Week 4 software architecture requirements and check if my Layered Architecture choice and component sketch cover what is required?"


## Dashboard — AI Prompt Log

### 2026-10-10: Dashboard front-end (index.html, dashboard.css, dashboard.js, mock-data.js)

**AI Tool:** Claude

**Asked:** I gave Claude the team's user stories and asked for Jira subtasks for the dashboard story, then asked for a front-end with application tracker columns by stage, the readiness checklist, upcoming interviews, and buttons to switch between interview and calendar views.

**Produced:** A page with four stage columns (In Progress, Applied, Interview, Offer), an upcoming-interviews list, a readiness checklist with completion percentage, and Interviews and Calendar views. It uses mock data kept in a separate file, so the data functions can later be replaced with calls to the Java backend.

**Changed or rejected:** I placed the files in app/main/resources/static/dashboard. When I first opened the page it was blank. The cause was that my file was named mock_data.js while index.html loads mock-data.js. I renamed it and the page worked. Moreover, I was not a big fan of the color palette it generated, so had to change the design a little bit. The data is mock data only, since the backend is not connected yet.

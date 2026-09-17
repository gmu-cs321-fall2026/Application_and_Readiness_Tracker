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

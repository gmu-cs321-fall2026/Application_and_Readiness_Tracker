# Application_and_Readiness_Tracker
Subsystem 2 for Mason CareerLaunch

The Application & Readiness Tracker helps students manage their career applications and prepare for upcoming career activities. The subsystem provides a centralized place to track application information, interview dates, and career-related events.

# About
The Application & Readiness Tracker is part of MasonCareerLaunch and is responsible for helping students organize and monitor their career application process.

The subsystem is designed to support:

- Tracking job and internship applications
- Storing application information
- Tracking interview dates and times
- Viewing upcoming interviews and registered career events
- Supporting calendar-based readiness tracking
- Maintaining application and readiness information in the shared application database

## Running the Application Tracker

The Application Tracker is currently implemented in Java 17. It supports creating job applications, updating application statuses, adding notes, and viewing applications by their progress.

### Run Locally

Make sure Java 17 or newer is installed.

From the project root, run:

```bash
mkdir -p out
javac -d out app/applicationtracker/*.java
java -cp out Main
```

### Run with Docker

Build the Docker image:

```bash
docker build -t application-tracker .
```

Run the application:

```bash
docker run -it --rm application-tracker
```

The application currently runs through a console menu. The web interface, API integration, and shared database are planned for future development.
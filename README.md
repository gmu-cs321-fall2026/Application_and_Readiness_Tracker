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


There are 5 features within this subsystem: 
- Application Tracker
- Readiness Checklist
- Calendar View
- Interview Stage Tracker
- The Dashboard 

## Running the Application Tracker

The Application Tracker is currently implemented in Java 17. It supports creating job applications, updating application statuses, adding notes, and viewing applications by their progress.

### Run Locally / console menu

Make sure Java 17 or newer is installed.

From the project root, run:

```bash
mkdir -p out
javac -d out app/applicationtracker/*.java
java -cp out Main
```

## Running the API server

make sure your files are compiled;
```
javac -d out app/applicationtracker/*.java
```

run the ApplicationApiServer:
```
java -cp out ApplicationApiServer
```

There will be a prompt notifying you where the application is running. click or copy paste the link

### Running tests/

1. compile 

```bash
javac -d out app/applicationtracker/*.java 
javac -d out tests/*.java
```
(can optionally put both paths from above on one line after javac -d out):

```bash
javac -d out app/applicationtracker/*.java tests/*.java 
```

2. Run

```bash
java -cp out [file name]
```

ex: java -cp out ChecklistTest


### Run with Docker

Build the Docker image:

```bash
docker build -t application-tracker .
```

Run the application:

```bash
docker run -it --rm application-tracker
```





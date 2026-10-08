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

## Running with Docker 

1. cd into the project folder
2. from the terminal/bash, build with this command:

docker build -t myapp .

2. run it with:

docker run -p 8000:8000 myapp 

3. Then, if successfull, open:

http://127.0.0.1:8000/ 

**Note: to stop the session, you can run ctrl + C (on Mac).


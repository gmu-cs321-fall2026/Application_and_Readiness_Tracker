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


### 2026-10-19 — GitHub Actions CI Setup

**Asked:**  
I asked ChatGPT to guide me through setting up GitHub Actions for our Java project, including automated linting, testing, and branch protection, while following the Sprint 3 assignment requirements.

**Produced:**  
ChatGPT provided a GitHub Actions CI workflow (`.github/workflows/ci.yml`), guidance for creating an automated Application Tracker test, Checkstyle configuration for Java linting, and instructions for creating a pull request and configuring branch protection rules.

**Changed or rejected:**  
I adapted the workflow to our existing Java project rather than using the Gradle starter workflow, since our application currently compiles directly with `javac`. I also used Java 17 to match our project's requirements.

**Process:**  
I created a separate feature branch, added an automated test for application creation, and configured the workflow to run linting and testing. I encountered a Checkstyle XML configuration error, which I corrected and verified locally. After committing and pushing the changes, I opened a pull request and confirmed that the `lint-and-test` check passed. I then merged the pull request into `main` and created an active `CI Protection` ruleset requiring pull requests and successful CI checks before merging future changes.


## Dashboard — AI Prompt Log

### 2026-10-10: Dashboard front-end (index.html, dashboard.css, dashboard.js, mock-data.js)

**AI Tool:** Claude

**Asked:** I gave Claude the team's user stories and asked for Jira subtasks for the dashboard story, then asked for a front-end with application tracker columns by stage, the readiness checklist, upcoming interviews, and buttons to switch between interview and calendar views.

**Produced:** A page with four stage columns (In Progress, Applied, Interview, Offer), an upcoming-interviews list, a readiness checklist with completion percentage, and Interviews and Calendar views. It uses mock data kept in a separate file, so the data functions can later be replaced with calls to the Java backend.

**Changed or rejected:** I placed the files in app/main/resources/static/dashboard. When I first opened the page it was blank. The cause was that my file was named mock_data.js while index.html loads mock-data.js. I renamed it and the page worked. Moreover, I was not a big fan of the color palette it generated, so had to change the design a little bit. The data is mock data only, since the backend is not connected yet.
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


### 5. Application Tracker Frontend, Backend, and Integration - 10/23

**Asked:** I asked ChatGPT to help me develop a complete frontend for my Application Tracker, connect it to our existing Java backend, implement persistent storage, and integrate my subsystem with the Dashboard and Calendar View. I wanted everything to work together while keeping the design consistent with our team's project and avoiding unnecessary changes to my teammates' code.

**Produced:** ChatGPT helped me create the Application Tracker frontend using HTML, CSS, and JavaScript. The interface organizes applications into three categories: Plan to Apply, Applied, and Past Applications. It also allows users to add applications, view their details, edit information, and update statuses. We connected the frontend to the Java backend using `ApplicationApiServer.java` and REST API endpoints. I then implemented file-based storage using `ApplicationStorage.java`, allowing applications to remain saved after restarting the server. For integration, I added a JavaScript file that displays real application counts on Daria's Dashboard and connected application deadlines to Harshita's existing Calendar View.

**Changed or rejected:** I made several adjustments throughout development to improve the functionality and integration. I changed the application creation process so users could select an initial status instead of always starting with Planned. I also chose to integrate with Harshita's existing calendar rather than creating a separate one. To avoid interfering with my teammates' work, I kept Daria's original Dashboard scripts unchanged and created a separate integrated copy of Harshita's calendar. I also requested terminal commands and explanations so I could understand and implement each change myself.

**Final result:** I developed a functional Application Tracker subsystem with a frontend, Java API, persistent storage, and connections to the Dashboard and Calendar. The main accomplishment was turning the Application Tracker from a standalone feature into a subsystem that can share real application data with other parts of our team's project.

### 6. Application Tracker UI Improvements

**Asked:** I asked ChatGPT to improve the Application Tracker's frontend design, make it consistent with our team's Dashboard, and organize the application information so users could navigate the tracker more easily.

**Produced:** ChatGPT helped me revise the HTML, CSS, and JavaScript to improve the layout of the three application categories, application cards, details panel, and add/edit forms. The updated interface includes status labels, application counts, clearer form fields, and buttons for viewing and editing applications.

**Changed or rejected:** I kept the three-column layout because it matched our original project requirements. I also focused on making the existing interface more usable instead of adding unnecessary features that would complicate the tracker.

### 7. ApplicationApiServer.java — REST API Development

**Asked:** I asked ChatGPT to help connect the Application Tracker frontend to the Java backend so application information could be created, retrieved, and updated through API requests.

**Produced:** ChatGPT helped develop REST API endpoints in `ApplicationApiServer.java`, including GET requests for retrieving applications, POST requests for creating applications, and PUT requests for updating existing applications. The server processes form data, converts application objects into JSON, and returns error responses when requests contain invalid information.

**Changed or rejected:** I kept the API structure compatible with the existing Java classes and frontend. I also made sure the Application Tracker endpoints could be used by other subsystems instead of creating a separate backend that only worked with my feature.

### 8. ApplicationStorage.java — Persistent Data Storage

**Asked:** I asked ChatGPT how to make application information remain saved after closing the browser or restarting the Java server.

**Produced:** ChatGPT helped implement `ApplicationStorage.java`, which saves application information to a TSV file and loads the saved records when the server starts. The storage system preserves application IDs, company names, positions, dates, sources, statuses, and notes.

**Changed or rejected:** I used file-based storage instead of introducing a database because it was sufficient for the current project requirements and easier to integrate with our existing Java implementation. I also made sure the storage format supported the additional application fields.

### 9. Dashboard Integration

**Asked:** I asked ChatGPT how to connect my Application Tracker to Daria's Dashboard so the Dashboard could display actual application counts instead of relying on manually entered or mock information.

**Produced:** ChatGPT helped implement the `/api/applications/summary` endpoint, which returns the total number of applications and counts for planned, applied, and past applications. This provides a shared source of application data that the Dashboard can retrieve.

**Changed or rejected:** I kept the existing Dashboard structure and focused on exposing the necessary information through the API. This avoided making unnecessary changes to Daria's feature while allowing the Dashboard to use real Application Tracker data.

### 10. Calendar View Integration

**Asked:** I asked ChatGPT how to make application deadlines available to Harshita's Calendar View without building a separate calendar inside the Application Tracker.

**Produced:** ChatGPT helped connect application information, including deadlines, to the Calendar integration. We also kept the existing Calendar API registration in the Java server so the calendar functionality could operate alongside the Application Tracker.

**Changed or rejected:** I decided to reuse Harshita's existing calendar implementation instead of creating another calendar. I focused on keeping the Application Tracker's date fields and API data compatible with the shared Calendar feature.

### 11. Interview Tracker Integration

**Asked:** I asked ChatGPT to help support Angelica's Interview Tracker by connecting interview rounds to specific applications and allowing interview information to be saved.

**Produced:** ChatGPT helped implement API support for retrieving interview rounds, adding scheduled interviews, and saving interview notes. Interview records are associated with an application ID, allowing multiple interview rounds to be connected to the correct application.

**Changed or rejected:** I kept interview information separate from the main application details while maintaining the connection through application IDs. I also retained the restriction that new interview rounds can only be scheduled when an application's status is Interview.

### 12. Application Status and Date Validation

**Asked:** While testing the Application Tracker, I noticed that the application date and status fields could become inconsistent. For example, users could select Planned while also entering a date indicating that they had already applied. I asked ChatGPT to fix these validation issues.

**Produced:** ChatGPT helped update `Application.java`, `ApplicationTracker.java`, and the frontend form validation. Planned and In Progress applications no longer require an application date, while submitted applications require a valid date that cannot be in the future. The form also disables and clears the application date when a planning status is selected.

**Changed or rejected:** I changed the original requirement that every application must have an application date because it did not make sense for applications that had not been submitted. I also added validation to the Java backend instead of relying only on frontend restrictions.

### 13. Editing Applications and Correcting Statuses

**Asked:** I asked ChatGPT to fix problems with editing applications, particularly when users needed to correct an incorrect status or update multiple fields at once.

**Produced:** ChatGPT helped revise the application update logic so users could edit company names, positions, sources, deadlines, notes, application dates, and statuses. The updated code validates the information before modifying the existing application and supports correcting previously selected statuses.

**Changed or rejected:** I kept the original status-transition validation for other parts of the application but allowed the edit form to correct mistakes. I also changed the update process so invalid information would not partially modify an existing record.

### 14. Deleting Applications

**Asked:** I noticed that the Application Tracker allowed users to create and edit applications but did not provide a way to remove them. I asked ChatGPT to add a delete feature that would also handle any interview records associated with the application.

**Produced:** ChatGPT helped implement a DELETE endpoint in `ApplicationApiServer.java`, a `deleteApplication()` method in `ApplicationTracker.java`, and a Delete Application button in the frontend. The interface asks for confirmation before deleting, and the backend updates the saved application and interview records.

**Changed or rejected:** I added a confirmation message to prevent accidental deletion. I also made sure deleting an application removed its associated interview information instead of leaving unrelated records in storage.

### 15. Frontend Error Handling and Form Improvements

**Asked:** I asked ChatGPT to improve the Application Tracker's usability by handling invalid inputs, failed saves, and repeated button clicks more effectively.

**Produced:** ChatGPT helped add required-field validation, error messages, loading states, and protections against duplicate submissions. The frontend also preserves entered information when a save request fails, allowing users to correct the issue without reentering everything.

**Changed or rejected:** I focused on preventing common user errors rather than adding more complicated functionality. I also kept validation on both the frontend and backend so invalid information would still be rejected if someone bypassed the interface.

### 16. Debugging Java Compilation Errors

**Asked:** After updating the Java backend, I encountered compilation errors in `ApplicationApiServer.java` and `Application.java`. I shared the terminal output with ChatGPT and asked for help identifying and fixing the problems.

**Produced:** ChatGPT explained that a Python script had accidentally been pasted into the Java server file and provided the complete Java replacement code. It also identified a duplicate `restoreStatus()` method in `Application.java` that caused another compilation error.

**Changed or rejected:** I replaced the incorrect server contents with Java code and removed the duplicate method while keeping the required functionality. I then recompiled the project using `javac` to check whether the errors were resolved.

### 17. Application Tracker Testing and Edge Cases

**Asked:** After implementing the changes, I asked ChatGPT to create specific testing tasks covering the Application Tracker's main features and possible edge cases.

**Produced:** ChatGPT provided test scenarios for creating applications, validating required fields and dates, editing application details, changing statuses, adding interview rounds, saving interview notes, deleting applications, and checking whether data remained saved after restarting the server.

**Changed or rejected:** I used specific test applications and performed the tests through the frontend instead of only checking whether the Java code compiled. I also included cases involving invalid inputs, canceled edits, deletion confirmation, and persistence to check how the system handled user mistakes.

### 18. Final Application Tracker Improvements

**Asked:** I asked ChatGPT to help finalize the Application Tracker by addressing the remaining functionality issues while preserving the existing connections to the Dashboard, Calendar View, Interview Tracker, and Readiness Checklist.

**Produced:** ChatGPT helped revise the Application Tracker's Java classes, API server, storage logic, and frontend files. The updated implementation supports creating, viewing, editing, and deleting applications, validating statuses and dates, saving information persistently, and maintaining the shared application and interview endpoints.

**Changed or rejected:** I prioritized fixing existing bugs and improving reliability instead of introducing additional features outside my assigned subsystem. I also avoided intentionally modifying my teammates' frontend implementations and kept the shared API structure compatible with the rest of the project.

**Final result:** The Application Tracker now supports the main application-management workflow, including persistent storage, status tracking, date validation, editing, deletion, and interview integration. I also tested the feature using different application scenarios and edge cases before preparing the changes for GitHub.



## October 11, 2026

**AI Tool:** Claude

**Use:** I gave Claude a description of the readiness checklist and asked Claude to create a basic setup for a project that had barely been in development. 

**Produced:** Claude created three files; Checklist.java, ChecklistItem.java, and ChecklistMenu.java . 

**Accepted or Rejected:** There were a lot of comments and fluff that I had to remove becuase it was talking about different packages. Everything else was left untouched and the files were added.

**Prompt:** I want to create a function for the checklist. this is the description : "Readiness checklist: A personal checklist analogous to a pre-flight check for the job search: resume drafted, resume reviewed, LinkedIn profile updated, elevator pitch practiced, target company list built, references identified, portfolio/GitHub current, mock interview completed, etc. Checklist items are configurable by Career Services staff as a default template; students can mark items complete and add their own custom items. No actual document upload or resume storage, status tracking and optional external links only. " create the code that would help create a "resume template" that every user will have by default to fill out.


## Interview Round Tracking 

**Date:** Oct 12-13, 2026
**AI tool:** Claude (Anthropic)

**What I asked for:** I shared the Subsystem 2 description, my user story and acceptance criteria, and our existing Application.java, ApplicationTracker.java, Main.java, and ApplicationStatus.java, and asked for code for my story that fit our existing design.

**What the AI produced:** InterviewRound, InterviewFormat, InterviewType, and
InterviewMenu classes; additions to Application.java and ApplicationTracker.java;
small edits to Main.java; and instructions for the Git workflow.

**What I did:**
- Reviewed the AI's code against our existing classes and the state machine,
  including the rule that rounds can only be added at INTERVIEW status.
- Updated my local copy when teammates' changes (the Readiness Checklist)
  changed Main.java, so my menu option was added without breaking theirs.
- Compiled and ran the program, and tested each acceptance criterion: adding
  rounds, date/time, format, type, notes, and multiple rounds per application.
- Tested error cases, such as adding a round before the status was INTERVIEW,
  entering a wrong application ID, and entering a nonexistent round number.
- Created a feature branch, committed, fixed my commit author, and resolved
  GitHub authentication problems to push the branch.
- Opened PR #5, confirmed there were no merge conflicts, merged it into main,
  and verified main still compiled and ran with my teammates' code.
- Told my team about the menu renumbering (Exit moved from 6 to 7).


## October 20, 2026

**AI Tool:** Claude

**Use:** Sprint 3 requires every story to ship with an automated test, so I asked Claude to help me write tests for my interview round feature (from Sprint 2). I gave it the Week 8 syllabus, my Sprint 3 story (Interview Management), and a screenshot of our existing ApplicationTrackerTest.java so the new tests would match our team's style (plain Java, a main method, PASS messages, and AssertionError on failure, with no JUnit).

**Produced:** Claude wrote InterviewRoundTest.java with 9 tests: round numbering, rounds only allowed at INTERVIEW status, required fields, round number boundaries, notes appending, sorting by date, round lookup boundaries, unknown application IDs, and the upcoming-interview check.

**Accepted or Rejected:** I used the test structure as written because it matches our existing test file. [Fill in after you've run it: whether all tests passed on my machine, whether CI ran the file, and any lint or style changes I had to make.]

**Prompt:** I pasted the Week 8 Sprint 3 syllabus, my story (Interview Management), and a screenshot of tests/ApplicationTrackerTest.java, and asked for automated tests for my interview round code that fit how our team writes tests.

## ChecklistTest.java
## October 27, 2026

**Ai Tool:** 
Claude

**Use:**
Claude was asked to create tests to ensure the checklist would not crash the application or update items incorrectly. Continued to maintin the format of other teammates; plain java file, pass/fail messages.


**Produced:**
Claude generated tests for ChecklistTest.java. The tests are meant to test if the checklist updates properly if items are added, whether checklist items are marked complete on click, whether they are marked incomplete if clicked twice, safety check if the user inputs an incorrect error.

**Accepted or Rejected:**
Files were tweaked slightly, there was a correction I manually made when connecting the Checklist.java file and ChecklistTest.java file.
The rest of the file was accepted.

**Prompt:** I provided ApplicationTrackerTests.java as an example of tests that needed to be created, and also included description of the checklist requirements.

-----
## November 6 2026
## Wiki 
**AI tool:** Claude 

**Use:**
I asked Claude for a template for the wiki display. I was unfamiliar with the wiki functionality and wanted it to look cleaner.

**Produced:**
A zip file and template for the wiki. 

**Accepted or Rejected:**
I only used the Navigation layout that was produced, but the files/endpoints that I used in those links are info from the CS321 project description page, or my own wording.

**Prompt:**
I asked Claude to help create a sidebar type layout

## checklist.java, checklistMenu

**AI tool:** Claude

**Use:** 
to update the checklist functionality to remove only custom items, not the default template. Also need functionality for links, so that was also asked

**Produced:**
toRemove function and updates to the switch statement. Also created functions for linking things and being able to add them to specific items. Tests were created to test both of these functions and ensure no crashing could happen.

**Accepted or Rejected:** 
Accepted the files and created functions for the remove function.


## checklist.java, checklistMenu

**AI tool:** Claude

**Use:** 
Update checklist for smaller "quality of life" functionality; marking ALL as complete or all as incomplete. able to rename an item if it gets misspelled.

**Produced:**
Created functions for marking all complete, resetting the checklist, renaming a custom item. tests were also created for each function

**Accepted or Rejected:** 
Accepted the created functions and tests. no changes needed to be made, everything ran and compiled easily.

## /checklist/

**AI tool:** Claude

**Use:** 
Needed to create a front end for the checklist files and needed to integrate them with the dashboard and other features.

**Produced:**
created the html,css, and js files for the checklist that were connected to the dashboard. There was some connection issues when loading the dashboard, but claude was able to figure out the issue (small fix)

**Accepted or Rejected:** 
Accepted all files and made small tweaks to index.html in dashboard to fix the checklist button not appearing and the calendar not linking properly.

## static/checklist/

**AI tool:** Claude

**Use:** 
To build off of the first "draft" of checklist front end files. Just added the functionality options that the console menu had. There was initially no "extra" functionality in the front end files.

**Produced:**
created the html,css, and js files for the checklist that were connected to the dashboard. Kept the same design that the dashboard had originally.

**Accepted or Rejected:** 
Accepted all files, changed the front end files for checklist. 

----

## November 10, 2026

**AI Tool:** Claude

**Use:** I pasted our InterviewStorage.java and asked Claude to write tests for saving and loading interview rounds. I also used it to walk me through testing interview rounds in Manavi's web front end.

**Produced:** tests/InterviewStorageTest.java with 7 tests. The tests found a bug: rounds were saved in date order but loaded in round-number order, so rounds added out of date order couldn't be reloaded after a restart. Claude suggested sorting rounds by round number in InterviewStorage.save.

**Accepted or Rejected:** I ran the tests and confirmed the bug, applied the fix, and checked that all storage tests and our existing tests pass. I told Manavi about the fix before opening a pull request because InterviewStorage is her code.

**Prompt:** I asked what else I could do for my part, then pasted InterviewStorage.java so the test would match our code.


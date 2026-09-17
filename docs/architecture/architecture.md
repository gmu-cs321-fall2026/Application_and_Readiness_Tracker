# Architectural Pattern: Layered Architecture

Our team selected the Layered Architecture pattern for Subsystem 2.

We chose this pattern because it separates the application into different responsibilities. The presentation layer handles what the user sees, the FastAPI layer handles API requests and application logic, and the data access layer handles communication with the PostgreSQL database.

This separation makes the system easier to understand, test, and maintain. It also allows one layer to be changed without requiring major changes to the other layers.

This architecture fits our project because Subsystem 2 needs to provide a web interface, receive application information through FastAPI, and store application data in the shared PostgreSQL database established by Subsystem 1.

The application will reference the existing User model through `userId` rather than duplicating user profile information.



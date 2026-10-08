
# Use Java 17 to build and run the application
FROM eclipse-temurin:17-jdk

# Set the working directory inside the container
WORKDIR /app

# Copy Application Tracker Java files
COPY app/applicationtracker/ ./applicationtracker/

# Compile the Java source files
RUN mkdir -p out && javac -d out applicationtracker/*.java

# Run the Application Tracker console program
CMD ["java", "-cp", "out", "Main"]

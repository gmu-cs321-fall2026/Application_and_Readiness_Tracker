FROM eclipse-temurin:17-jdk

WORKDIR /app

COPY app/applicationtracker/ ./applicationtracker/
COPY app/main/resources/static/ ./app/main/resources/static/

RUN mkdir -p out && javac -d out applicationtracker/*.java

RUN mkdir -p data

EXPOSE 8080

CMD ["java", "-cp", "out", "ApplicationApiServer"]

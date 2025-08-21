# Start with a base image that has Java 17 installed
FROM openjdk:24-slim

# Set a working directory inside the container
WORKDIR /app

# Copy the compiled .jar file from your computer's 'target' directory
# into the container at /app/app.jar
COPY target/*.jar app.jar

# Tell Docker that the container will listen on port 8080
EXPOSE 8080

# This is the command that will run when the container starts
ENTRYPOINT ["java", "-jar", "app.jar"]
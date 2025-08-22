# Stage 1: Build the application using a standard Maven image with Eclipse Temurin JDK 24
FROM maven:3-eclipse-temurin-24 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src

# This command builds your project using Java 24
RUN mvn clean package -DskipTests


# Stage 2: Create the final, lightweight image using a secure Alpine JRE 24
FROM eclipse-temurin:24-jre-alpine
WORKDIR /app

# This copies the .jar file that was created in the stage above
COPY --from=build /app/target/*.jar app.jar

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
FROM maven:3.9.11-eclipse-temurin-21 AS build
WORKDIR /app

COPY pom.xml .
COPY src ./src

RUN mvn -DskipTests package

FROM eclipse-temurin:21-jre-jammy
WORKDIR /app

RUN useradd --system --create-home --shell /usr/sbin/nologin appuser

COPY --from=build /app/target/*.jar /app/app.jar

USER appuser
EXPOSE 8080

ENTRYPOINT ["java", "-jar", "/app/app.jar"]
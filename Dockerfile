# ============ BUILD STAGE ============
FROM maven:3.9.11-eclipse-temurin-17 AS build

WORKDIR /app

# Kopiér pom.xml først (udnytter Docker layer cache)
COPY pom.xml .

# Download dependencies (caches i eget layer)
RUN mvn dependency:go-offline -B

# Kopiér source code
COPY src ./src

# Byg applikationen (skip tests - de køres i CI)
RUN mvn clean package -DskipTests

# ============ RUNTIME STAGE ============
FROM eclipse-temurin:17-jre

WORKDIR /app

# Kopiér JAR fra build stage
COPY --from=build /app/target/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]

# ==============================================================================
# 1. BUILD STAGE (Maven + JDK 21 Temurin)
# ==============================================================================
FROM eclipse-temurin:21-jdk-jammy AS builder

WORKDIR /app

# Copie du Maven Wrapper et des dépendances d'abord pour bénéficier du cache Docker
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
RUN chmod +x mvnw && ./mvnw dependency:go-offline -B

# Copie des sources et compilation du JAR exécutable (sans exécuter les tests lents en conteneur)
COPY src/ src/
RUN ./mvnw clean package -DskipTests -B

# ==============================================================================
# 2. RUNTIME STAGE (JRE 21 léger et sécurisé)
# ==============================================================================
FROM eclipse-temurin:21-jre-jammy AS runner

WORKDIR /app

# Création d'un utilisateur non-root et du répertoire persistant d'uploads
RUN groupadd -r spring && useradd -r -g spring spring \
    && mkdir -p /app/uploads && chown -R spring:spring /app/uploads

USER spring:spring

# Copie du JAR depuis le stage de compilation
COPY --from=builder --chown=spring:spring /app/target/*.jar app.jar

# Variables d'environnement par défaut
ENV SPRING_PROFILES_ACTIVE=mysql \
    UPLOAD_DIR=/app/uploads/ \
    JAVA_OPTS="-Xms256m -Xmx512m -XX:+UseG1GC"

VOLUME ["/app/uploads"]

EXPOSE 8080

# Démarrage optimisé de la JVM
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]

# [[project_name]]

Angular-Frontend, Spring-Boot-Backend (Java 21), PostgreSQL und Flyway.
[% if auth_mode == "bundled" %]
Keycloak wird mit einem lokalen Test-Realm mitgeliefert.
[% else %]
Authentifizierung erfolgt über [[external_auth_issuer_uri]]. Der externe
Keycloak muss den öffentlichen Client `[[ keycloak_client_id ]]` mit Code Flow,
PKCE S256 und den lokalen sowie produktiven Redirect-URLs/Web Origins enthalten.
[% endif %]

## Schnellstart: Backend in IntelliJ

Voraussetzungen: Java 21, Node.js 22, Docker mit Compose v2 und IntelliJ IDEA.
Im Projektverzeichnis einmalig:

```bash
npm run setup
```

Danach für jede Entwicklungssitzung:

```bash
npm run dev
```

Das startet PostgreSQL und gegebenenfalls Keycloak in Docker sowie das Frontend
lokal mit `ng serve`. Änderungen am Frontend werden automatisch neu gebaut und
im Browser aktualisiert. Das Backend wird unabhängig in IntelliJ gestartet:

1. `[[ backend_artifact_id ]]/pom.xml` als Maven-Projekt öffnen und JDK 21 wählen.
2. Main-Klasse `[[ java_package ]].[[ java_application_class ]]` öffnen.
3. Eine Application-Run-Konfiguration für diese Klasse anlegen.
4. Unter **Program arguments** `--spring.profiles.active=local` eintragen
   (alternativ Umgebungsvariable `SPRING_PROFILES_ACTIVE=local` oder in IntelliJ unter Run Configurations und Active profiles `local` eintragen).
5. Mit Run oder Debug starten. Spring Boot lauscht auf Port 8080.

Eine normale Java-Application-Konfiguration genügt, auch ohne IntelliJ-Spring-Unterstützung.
Das explizite Profil `local` enthält lokale Datenbankzugänge und OIDC-Adressen;
Docker- und Produktionsstarts verwenden es nicht. IntelliJ liest `.env` nicht
selbstständig ein. Bereits gesetzte `SPRING_*`-Umgebungsvariablen haben Vorrang
vor dem Profil; alte Docker-Overrides aus der Run-Konfiguration entfernen.

| Dienst                 | Adresse                                                                                                |
| ---------------------- | ------------------------------------------------------------------------------------------------------ |
| Frontend               | http://localhost:[[app_port]]                                                                          |
| API über Angular-Proxy | http://localhost:[[app_port]]/api/hello                                                                |
| Backend direkt         | http://localhost:8080/api/hello                                                                        |
| Health                 | http://localhost:8080/actuator/health                                                                  |
| PostgreSQL             | localhost:5432, DB `[[ postgres_db ]]`, User `[[ postgres_user ]]`, Passwort `[[ postgres_password ]]` |

[% if auth_mode == "bundled" %]
| Keycloak über Angular | http://localhost:[[app_port]]/auth/ |
| Keycloak interner Zugriff/JWK | http://localhost:8081/auth/ |

Login: `[[ keycloak_test_username ]]` / `[[ keycloak_test_password ]]`.
Keycloak-Admin: `[[ keycloak_admin_username ]]` / `[[ keycloak_admin_password ]]`.
Keycloak braucht beim ersten Start etwas länger; bei „Realm nicht erreichbar“
kurz die Logs prüfen und den Login erneut öffnen.
[% endif %]

Angular leitet `/api` und `/actuator` an localhost:8080 und beim gebündelten
Keycloak `/auth` an localhost:8081 weiter. Browser und Backend validieren denselben
öffentlichen Issuer auf Port [[app_port]]; die Signaturschlüssel lädt das Backend
direkt von Keycloak. Deshalb stets `localhost` als Browseradresse verwenden.

### Dienste einzeln starten und stoppen

```bash
npm run infra:up      # PostgreSQL + Keycloak, ohne Frontend/Backend
npm run frontend      # nur ng serve
npm run backend       # Backend alternativ ohne IntelliJ, mit Profil local

docker compose -f compose.dev.yml up -d postgres
[% if auth_mode == "bundled" %]
docker compose -f compose.dev.yml up -d keycloak
[% endif %]
docker compose -f compose.dev.yml logs -f
npm run infra:down
```

`Ctrl+C` beendet Angular; die Infrastruktur läuft weiter. `infra:down` erhält
Daten und Realm im Volume. `down -v` löscht diese lokalen Daten vollständig.
Die Entwicklung nutzt eigene Volumes und den Compose-Namen `[[ project_slug ]]-dev`.
`compose.dev.yml` enthält feste lokale Werte und verwendet keine Produktionssecrets.
Für andere lokale Ports die Portzuordnung, `proxy.conf.json`, das Profil `local`
und gegebenenfalls die Keycloak-Hostname-/Redirect-Einstellungen zusammen ändern.

## Vollständiger lokaler Docker-Stack

```bash
# ng serve vorher beenden: derselbe öffentliche Port wird verwendet.
cp .env.example .env  # optional
docker compose up --build -d
```

App: [[public_base_url]], API: [[public_base_url]]/api/hello.
Nginx liefert den Angular-Produktionsbuild aus und leitet API und Auth intern weiter.
Nur der Frontend-Port wird veröffentlicht. `.env` gehört zu diesem Startweg;
`compose.dev.yml` und das IntelliJ-Profil haben ihre eigenen lokalen Werte.

```bash
docker compose logs -f
docker compose down
```

## Anwendung entwickeln

- Backend: `[[ backend_artifact_id ]]/src/main/java/[[ java_package_path ]]`.
  Controller, Services und DTOs sind getrennt.
- Frontend: `[[ frontend_app_name ]]/src/app`, mit `auth`, `models`, `services`.
- Neue Datenbankmigrationen: `src/main/resources/db/migration/V2__beschreibung.sql`
  im Backend. Ausgeführte Migrationen nicht nachträglich ändern.
- `GET /api/hello` ist öffentlich, `GET /api/me` erfordert ein Bearer-Token.

```bash
cd [[ backend_artifact_id ]]
./mvnw verify
cd ../[[ frontend_app_name ]]
npm ci
npm run build
npm test -- --watch=false --browsers=ChromeHeadless
```

Frontendtests benötigen Chrome/Chromium, bei Bedarf `CHROME_BIN` setzen.

## Produktion: GHCR + SSH + Nginx Proxy Manager

Das Deployment entspricht dem Schafsmarkt-Modell: separate Produktions-Compose-Datei,
versionierte Images in GHCR, Server mit Docker und externem Netzwerk `proxy`.
Frontend, `/api` und beim gebündelten Keycloak `/auth` verwenden eine HTTPS-Domain.
Nginx liefert den gebauten Angular-Code aus; `ng serve` gehört nur zur Entwicklung.

### Server einmalig vorbereiten

Linux/amd64, Docker Engine mit aktuellem Compose-Plugin und einen Deploymentnutzer
mit Docker-Zugriff bereitstellen. Beispiel:

```bash
sudo mkdir -p /opt/[[ project_slug ]]
sudo chown deploy:deploy /opt/[[ project_slug ]]
docker network inspect proxy >/dev/null 2>&1 || docker network create proxy
```

Vom lokalen Rechner:

```bash
scp deploy/prod.env.example deploy@SERVER:/opt/[[ project_slug ]]/.env.prod
ssh deploy@SERVER 'chmod 600 /opt/[[ project_slug ]]/.env.prod'
```

Auf dem Server alle `CHANGE_ME` ersetzen und `PUBLIC_BASE_URL` auf die öffentliche
HTTPS-Adresse **ohne abschließenden Slash** setzen. Image-Namen müssen kleingeschrieben
sein. `.env.prod` wird von der Pipeline nicht überschrieben. Pro Projekt eigene
Diagnoseports wählen, falls mehrere Projekte auf demselben Server laufen.

In Nginx Proxy Manager (ebenfalls im Netzwerk `proxy`):

- Domain: Host aus `PUBLIC_BASE_URL`
- Scheme: `http`
- Forward Hostname: `[[ project_slug ]]-frontend`
- Forward Port: `80`
- TLS-Zertifikat und „Force SSL“ aktivieren

Nginx übernimmt die vom Proxy gelieferten HTTPS-Header. Datenbank und Backend
sind im privaten Compose-Netz; Diagnoseports sind ausschließlich an 127.0.0.1 gebunden.

### GitHub Actions

Repository-Environment `production` erstellen und Secrets hinterlegen:

| Secret                        | Inhalt                                                               |
| ----------------------------- | -------------------------------------------------------------------- |
| `VPS_HOST`                    | Server-IP oder Hostname                                              |
| `VPS_USER`                    | SSH-Deploymentnutzer                                                 |
| `VPS_SSH_KEY`                 | Privater SSH-Schlüssel                                               |
| `VPS_HOST_FINGERPRINT`        | Vertrauenswürdig geprüfter SHA256-Fingerprint des SSH-Hostschlüssels |
| `VPS_APP_DIR`                 | `/opt/[[ project_slug ]]`                                            |
| `GHCR_USERNAME`, `GHCR_TOKEN` | Bei privaten Images: Benutzer und Token mit `read:packages`          |

Pull Requests testen Backend und Frontend und bauen Angular. Ein Push auf
`[[ git_default_branch ]]` baut nach erfolgreichen Tests die Container, veröffentlicht
sie in GHCR und deployt die Commit-SHA-Tags per SSH. Der Workflow wartet auf den
Healthcheck. `.images.env` auf dem Server speichert die gewählten Image-Tags.
Ein fehlgeschlagenes Deployment rollt nicht automatisch zurück; Logs und
Datenbankmigrationen prüfen, bevor ältere Images verwendet werden.

[% if auth_mode == "bundled" %]

### Produktions-Keycloak

`deploy/keycloak/realm-prod.json` enthält keine Testbenutzer, erzwingt PKCE S256
und deaktiviert Direct Access Grants. Redirect-URLs und Web Origins werden beim
Import aus `PUBLIC_BASE_URL` eingesetzt. Keycloak läuft mit `start` und speichert
seine Daten in `keycloak_db` im persistenten PostgreSQL-Volume. Diese Datenbank
wird nur beim ersten Start eines leeren Volumes durch `postgres/init.sql` angelegt.

Nach dem ersten Start echte Benutzer in der Administration anlegen und die Realm-Rolle
`USER` zuweisen. Bei Bedarf SMTP und E-Mail-Verifikation konfigurieren. Bereits
existierende Realms werden beim Start nicht überschrieben: spätere Änderungen
gezielt in der Administration oder durch einen kontrollierten Import durchführen.
[% else %]
Der externe Keycloak wird separat betrieben und gesichert. Seine Client-ID,
Redirect-URLs und Web Origins müssen zum Frontend passen. Bei anderem Produktions-Issuer
auch `src/app/auth/auth.service.ts` ändern und neu bauen.
[% endif %]

### Manuelles Deployment / Diagnose

Den Inhalt von `deploy/` ins Serververzeichnis übertragen. Bei manueller Erstinstallation
`BACKEND_IMAGE` und `FRONTEND_IMAGE` in `.env.prod` auf vorhandene Commit-Tags setzen;
bei Verwendung der Pipeline überschreibt `.images.env` diese Werte.

```bash
cd /opt/[[ project_slug ]]
# --env-file .images.env bei manueller Erstinstallation weglassen.
docker compose --env-file .env.prod --env-file .images.env -f compose.prod.yml pull
docker compose --env-file .env.prod --env-file .images.env -f compose.prod.yml up -d --wait --wait-timeout 180
docker compose --env-file .env.prod --env-file .images.env -f compose.prod.yml logs -f --tail=200
curl --fail http://127.0.0.1:18080/actuator/health
```

### Backup und Restore

Auf dem Server `bash backup.sh` ausführen. Das Skript erstellt PostgreSQL-Custom-Dumps
in `backups/<UTC-Zeit>/`; ein anderes Ziel lässt sich über `BACKUP_DIRECTORY` setzen.
Anwendungs- und Keycloak-Dump entstehen nacheinander. Für einen gemeinsamen,
konsistenten Stand Schreibzugriffe während des Backups pausieren. Backups regelmäßig
extern sichern und Wiederherstellung auf einem separaten System testen.

Restore in vorbereitete leere Datenbanken (Anwendung/Keycloak vorher stoppen):

```bash
docker compose --env-file .env.prod -f compose.prod.yml exec -T postgresql \
  sh -c 'pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --no-owner --exit-on-error' < backups/ZEIT/app.dump
[% if auth_mode == "bundled" %]
docker compose --env-file .env.prod -f compose.prod.yml exec -T postgresql \
  sh -c 'pg_restore -U "$POSTGRES_USER" -d keycloak_db --no-owner --exit-on-error' < backups/ZEIT/keycloak.dump
[% endif %]
```

## Referenzen

[Angular-Entwicklungsproxy](https://angular.dev/tools/cli/serve) ·
[Keycloak-Realm-Import](https://www.keycloak.org/server/importExport)

# [[ project_name ]] Project

Dieses Projekt wurde aus einem Copier-Template erzeugt.
Es enthaelt ein Angular Frontend, ein Spring Boot Backend, PostgreSQL, Flyway und Keycloak.

## Stack

- Frontend: Angular, Nginx
- Backend: Spring Boot, Spring Security, OAuth2 Resource Server, Actuator
- Datenbank: PostgreSQL
- Migrationen: Flyway
- Auth: Keycloak Realm Import
- Runtime: Docker Compose

## Start

```bash
docker compose up --build
```

Danach ist die Anwendung erreichbar:

- App: [[ public_base_url ]]
- API: [[ public_base_url ]]/api
- Health: [[ public_base_url ]]/actuator/health
[% if auth_mode == "bundled" %]
- Keycloak: [[ public_base_url ]]/auth
[% else %]
- Auth: [[ external_auth_issuer_uri ]]
[% endif %]

Nur der Nginx/Frontend-Container veroeffentlicht einen Port nach aussen.
Backend, PostgreSQL und der gebuendelte Keycloak bleiben im Docker-Netzwerk.

## Demo Login

Im Frontend gibt es einen kleinen OIDC Login.

[% if auth_mode == "bundled" %]
Testbenutzer:

- Benutzername: `[[ keycloak_test_username ]]`
- Passwort: `[[ keycloak_test_password ]]`

Keycloak Admin:

- URL: [[ public_base_url ]]/auth
- Benutzername: `[[ keycloak_admin_username ]]`
- Passwort: `[[ keycloak_admin_password ]]`
[% else %]
Dieses Projekt ist fuer einen externen OIDC Provider konfiguriert:

```text
[[ external_auth_issuer_uri ]]
```

Client ID:

```text
[[ keycloak_client_id ]]
```
[% endif %]

Nach dem Login ruft das Frontend den geschuetzten Endpunkt `GET /api/me` mit Bearer Token auf.

## API

Oeffentlich:

```bash
curl [[ public_base_url ]]/api/hello
```

Antwort:

```json
{"message":"Hello World"}
```

Geschuetzt:

```text
GET /api/me
```

Health:

```bash
curl [[ public_base_url ]]/actuator/health
```

## Environment

Die Datei `.env.example` dokumentiert die verfuegbaren Variablen.
Optional kann sie kopiert werden:

```bash
cp .env.example .env
```

`compose.yml` enthaelt Defaults, daher ist eine `.env` Datei fuer den lokalen Start nicht erforderlich.

## Deployment Modell

Das Projekt ist fuer eine Subdomain pro generierter Anwendung ausgelegt:

```text
[[ public_base_url ]]/        -> Angular Frontend
[[ public_base_url ]]/api     -> Spring Boot Backend
[% if auth_mode == "bundled" %]
[[ public_base_url ]]/auth    -> Projekt-eigener Keycloak
[% else %]
[[ external_auth_issuer_uri ]] -> Externer OIDC Provider
[% endif %]
```

Dadurch kollidiert das Projekt nicht mit bestehenden Diensten wie `api.example.com`
oder `auth.example.com`.

## Projektstruktur

Backend:

```text
[[ backend_artifact_id ]]/src/main/java/[[ java_package_path ]]/
├── config/
├── controller/
├── dto/
├── exception/
├── mapper/
├── model/
├── repository/
└── service/
```

Frontend:

```text
[[ frontend_app_name ]]/src/app/
├── auth/
├── components/
├── models/
├── pages/
├── services/
├── app.component.*
├── app.config.ts
└── app.routes.ts
```

## Entwicklung

Backend testen:

```bash
cd [[ backend_artifact_id ]]
./mvnw test
```

Frontend bauen:

```bash
cd [[ frontend_app_name ]]
npm run build
```

Frontend testen:

```bash
cd [[ frontend_app_name ]]
npm test -- --watch=false --browsers=ChromeHeadless
```

## Git

[% if init_git %]
Dieses Projekt wurde beim Generieren als Git-Repository initialisiert.
[% if git_remote_url %]
Der Remote `origin` wurde gesetzt auf:

```text
[[ git_remote_url ]]
```
[% else %]
Es wurde kein Git Remote gesetzt.
[% endif %]

Initialer Commit:

```bash
git add .
git commit -m "Initial commit"
```

[% if git_remote_url %]
Push zum Remote:

```bash
git push -u origin [[ git_default_branch ]]
```
[% endif %]
[% else %]
Dieses Projekt wurde ohne Git-Repository generiert.
Du kannst Git spaeter manuell initialisieren:

```bash
git init -b [[ git_default_branch ]]
git add .
git commit -m "Initial commit"
```
[% endif %]

## Template Hinweise

- Die Werte in `.env.example` passen zu den beim Generieren gewaehlten Copier-Antworten.
- Viele technische Namen werden aus `project_name` abgeleitet:
  - `project_slug`
  - `backend_artifact_id`
  - `frontend_app_name`
  - `java_package`
  - `java_application_class`
  - `keycloak_realm`
  - `keycloak_client_id`
- `backend_group_id` wird aus `java_package_base` abgeleitet.
- `auth_mode=bundled` startet einen eigenen Keycloak unter `/auth`.
- `auth_mode=external` verwendet einen bestehenden OIDC Provider und startet keinen Keycloak-Container.

# Fullstack-Copier-Template

Erzeugt ein eigenständiges Projekt mit Angular 19, Spring Boot 4 / Java 21,
PostgreSQL 16, Flyway und optional Keycloak 26.3. Diese README beschreibt die
**Pflege und Verwendung des Templates**. Die README im erzeugten Projekt erklärt
Entwicklung, IntelliJ, Docker und Deployment.

## Projekt erzeugen

Voraussetzungen: Python mit [Copier](https://copier.readthedocs.io/), Git.
Für die anschließende Entwicklung: Node.js 22, Java 21 und Docker Compose v2.

```bash
pipx install copier
copier copy --trust /Users/patrick/Developer/Template/Fullstack_Template /pfad/zum/ziel
```

Copier fragt die Projektdaten ab und erzeugt unter dem Ziel einen zusätzlichen
Ordner mit dem `project_slug`. `--trust` erlaubt die enthaltenen Git-Tasks:
optional `git init` und das Setzen von `origin`. Es wird nichts gepusht.
Bei einer lokalen Template-Änderung vor dem Commit `--vcs-ref=HEAD` verwenden.

Beispiel ohne Rückfragen:

```bash
copier copy --trust --defaults --vcs-ref=HEAD \
  -d project_name=MeineApp -d init_git=false . /tmp/template-demo
cd /tmp/template-demo/meineapp
npm run setup
npm run dev
```

Danach das Backend-POM in IntelliJ öffnen und die Main-Klasse mit
`--spring.profiles.active=local` starten. Details stehen in der erzeugten README.

## Parameter

| Parameter | Bedeutung |
| --- | --- |
| `project_name`, `project_slug` | Anzeigename und Ordner-/Compose-Name |
| `java_package_base` | Java-Basispaket, standardmäßig `com.example` |
| `init_git`, `git_remote_url`, `git_default_branch` | Git-Initialisierung |
| `app_port` | Lokaler Angular-/Docker-Port, standardmäßig 4200 |
| `public_base_url` | URL des vollständigen lokalen Docker-Stacks |
| `auth_mode` | `bundled` für eigenen Keycloak, `external` für bestehenden Keycloak |
| `external_auth_issuer_uri` | Realm-Issuer des externen Keycloak |
| `postgres_*`, `keycloak_admin_*`, `keycloak_test_*` | Lokale Entwicklungszugänge |

`java_package_base` wird bereits bei der Eingabe geprüft. Unterstützt werden
ASCII-Buchstaben, Ziffern und Unterstriche in durch Punkte getrennten Namen.
Ziffern am Anfang eines Segments, leere Segmente, Bindestriche, Leerzeichen und
reservierte Java-Wörter werden abgewiesen. Beispiel: `de.fotoboxjansen`.
Die Prüfung verwendet einen [Copier-Validator](https://copier.readthedocs.io/en/latest/configuring/#questions).

Backend-/Frontend-Namen, Java-Klasse, Package-Pfad, Realm und Client-ID werden
abgeleitet. Lokale Zugangsdaten werden in generierte Dateien geschrieben;
hier ausschließlich Entwicklungswerte verwenden. Produktionssecrets liegen nur
in `.env.prod` auf dem Server. Die Produktionsdomain wird dort konfiguriert.
Bei externem Keycloak ist der Issuer auch im Frontend enthalten; ein Wechsel
braucht eine Änderung in `auth.service.ts` und einen neuen Frontend-Build.

## Aufbau

- `copier.yml`: Fragen, abgeleitete Namen, Git-Tasks und Jinja-Konfiguration.
- `[[ project_slug ]]/`: vollständiges Projekt einschließlich eigener README.
- `compose.dev.yml`: lokale Infrastruktur für IntelliJ und `ng serve`.
- `compose.yml`: kompletter lokaler Container-Stack.
- `deploy/` und generierte `.github/workflows/ci-cd.yml`: Produktion analog
  Schafsmarkt, mit GHCR, SSH und Nginx Proxy Manager.

Die Jinja-Variablen verwenden `[[ ... ]]`, Bedingungen `[% ... %]`.
Dadurch bleiben Angular-Interpolation und GitHub-Ausdrücke `${{ ... }}` erhalten.
Die Root-README wird nicht in Projekte kopiert; die Projekt-README liegt im
Template-Unterordner. Generierte GitHub-Workflows müssen mitkopiert werden.

## Template ändern und prüfen

Änderungen direkt im Template-Unterordner vornehmen. Anschließend beide
Auth-Varianten in temporäre Verzeichnisse rendern:

```bash
python3 -m venv /tmp/fullstack-template-venv
/tmp/fullstack-template-venv/bin/pip install copier pyyaml
/tmp/fullstack-template-venv/bin/python tests/check_template.py
/tmp/fullstack-template-venv/bin/python tests/check_java_package.py
```

Der Check rendert mit Copier, prüft JSON/YAML, lokale und produktive
Compose-Konfiguration, Profile, Realm und den enthaltenen Workflow.
Er benötigt Copier, PyYAML und Docker Compose; keinen laufenden Docker-Daemon.
Danach in einem erzeugten Projekt die Anwendungstests ausführen:

```bash
npm run setup
npm --prefix meineapp-frontend run build
cd meineapp-backend
./mvnw verify
```

Für einen Laufzeittest zusätzlich Login, `/api/hello`, `/api/me` und
`/actuator/health` mit IntelliJ + Angular sowie im vollständigen Docker-Stack prüfen.
Die Produktionspipeline ist für Linux/amd64-Server vorbereitet.

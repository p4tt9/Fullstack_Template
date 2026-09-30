"""Render both auth modes and check deployment/dev configuration without a daemon."""
import json
import subprocess
import tempfile
from pathlib import Path
import yaml

root = Path(__file__).resolve().parents[1]
for mode in ('bundled', 'external'):
    with tempfile.TemporaryDirectory(prefix='fullstack-check-') as temp:
        subprocess.run(['copier', 'copy', '--trust', '--defaults', '--vcs-ref=HEAD',
                        '-d', 'project_name=Smoke App', '-d', 'init_git=false',
                        '-d', f'auth_mode={mode}', '-d', 'app_port=4300',
                        '-d', 'git_default_branch=develop', str(root), temp], check=True,
                       stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)
        app = Path(temp) / 'smoke-app'
        assert (app / '.github/workflows/ci-cd.yml').is_file(), 'Workflow excluded from generated project'
        workflow = (app / '.github/workflows/ci-cd.yml').read_text()
        assert 'refs/heads/develop' in workflow
        assert '${{ github.sha }}' in workflow
        angular = json.loads((app / 'smoke-app-frontend/angular.json').read_text())
        assert angular['projects']['smoke-app-frontend']['architect']['serve']['options']['port'] == 4300
        assert not (Path(temp) / 'README.md').exists(), 'Template README leaked into output'
        for path in app.rglob('*.json'):
            if not path.name.startswith('tsconfig') and '.vscode' not in path.parts:
                json.loads(path.read_text())
        for path in app.rglob('*.yml'):
            yaml.safe_load(path.read_text())
        profile = yaml.safe_load((app / 'smoke-app-backend/src/main/resources/application-local.yml').read_text())
        assert profile['spring']['datasource']['url'] == 'jdbc:postgresql://localhost:5432/app'
        realm = json.loads((app / 'deploy/keycloak/realm-prod.json').read_text())
        assert 'users' not in realm
        assert realm['clients'][0]['attributes']['pkce.code.challenge.method'] == 'S256'
        for compose, env in [('compose.yml', '.env.example'), ('compose.dev.yml', '.env.example'),
                             ('deploy/compose.prod.yml', 'deploy/prod.env.example')]:
            result = subprocess.run(['docker', 'compose', '--env-file', env, '-f', compose,
                                     'config', '--format', 'json'], cwd=app, check=True, capture_output=True, text=True)
            config = json.loads(result.stdout)
            assert ('keycloak' in config['services']) == (mode == 'bundled')
            if compose == 'compose.dev.yml':
                assert set(config['services']) == ({'postgres', 'keycloak'} if mode == 'bundled' else {'postgres'})
            if compose == 'deploy/compose.prod.yml':
                assert 'build' not in config['services']['smoke-app-frontend']
                assert config['networks']['proxy']['external']
        subprocess.run(['bash', '-n', str(app / 'deploy/backup.sh')], check=True)
        print(f'{mode}: render, JSON/YAML, Compose, production realm and backup syntax OK')

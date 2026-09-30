"""Exercise the actual Copier question validator, including CLI-provided answers."""
import subprocess
import tempfile
from pathlib import Path

root = Path(__file__).resolve().parents[1]
valid = ['com.example', 'de.fotoboxjansen', 'de.fotobox_jansen', 'org.app2', 'example', 'de.classic']
invalid = ['de.fotobox-jansen', '', 'de..app', '.de.app', 'de.app.', 'de.2app',
           'de.app name', 'de.app\n', 'de/app', 'de.class', 'int.app',
           'de.true', 'de.false', 'de.null', 'de._']
for package in valid + invalid:
    with tempfile.TemporaryDirectory(prefix='package-validation-') as temp:
        result = subprocess.run(
            ['copier', 'copy', '--trust', '--defaults', '--vcs-ref=HEAD',
             '-d', 'init_git=false', '-d', 'project_name=Package Check',
             '-d', f'java_package_base={package}', str(root), temp],
            text=True, capture_output=True,
        )
        app = Path(temp) / 'package-check'
        if package in valid:
            assert result.returncode == 0, result.stderr
            source = app / 'package-check-backend/src/main/java' / package.replace('.', '/') / 'apppackagecheck/AppPackageCheckApplication.java'
            assert f'package {package}.apppackagecheck;' in source.read_text()
        else:
            assert result.returncode != 0, f'Accepted invalid package: {package!r}'
            assert 'Ungültiges Java-Basispaket' in result.stderr, result.stderr
            assert not app.exists(), 'Invalid input created project files'
print(f'Java package validation: {len(valid)} valid and {len(invalid)} invalid inputs checked')

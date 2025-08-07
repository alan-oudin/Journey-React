@echo off
echo === Installation des dépendances pour l'import Excel ===
echo.

cd /d "%~dp0.."

if not exist "composer.phar" (
    echo Téléchargement de Composer...
    php -r "copy('https://getcomposer.org/installer', 'composer-setup.php');"
    php composer-setup.php
    php -r "unlink('composer-setup.php');"
)

echo Installation des dépendances PHP...
php composer.phar install

echo.
echo === Installation terminée ===
echo.
echo Vous pouvez maintenant utiliser:
echo - import_whitelist_csv.php pour importer depuis CSV (recommandé)
echo - import_whitelist_excel.php pour importer directement depuis Excel
echo.
pause
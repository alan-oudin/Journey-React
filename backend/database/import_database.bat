@echo off
echo Importing database for Journee des Proches...

REM Check if database exists, create if not
echo Creating database if it doesn't exist...
IF EXIST "C:\wamp64\bin\mysql\mysql9.1.0\bin\mysql.exe" (
    "C:\wamp64\bin\mysql\mysql9.1.0\bin\mysql.exe" -u root -e "CREATE DATABASE IF NOT EXISTS journee_proches;"
) ELSE IF EXIST "C:\wamp64\bin\mysql\mysql5.7.36\bin\mysql.exe" (
    "C:\wamp64\bin\mysql\mysql5.7.36\bin\mysql.exe" -u root -e "CREATE DATABASE IF NOT EXISTS journee_proches;"
) ELSE IF EXIST "C:\wamp64\bin\mysql\mysql8.0.31\bin\mysql.exe" (
    "C:\wamp64\bin\mysql\mysql8.0.31\bin\mysql.exe" -u root -e "CREATE DATABASE IF NOT EXISTS journee_proches;"
) ELSE IF EXIST "C:\xampp\mysql\bin\mysql.exe" (
    "C:\xampp\mysql\bin\mysql.exe" -u root -e "CREATE DATABASE IF NOT EXISTS journee_proches;"
) ELSE (
    echo MySQL executable not found in common locations.
    echo Please check your MySQL installation and update this script with the correct path.
    echo Common paths:
    echo - C:\wamp64\bin\mysql\mysql9.1.0\bin\mysql.exe
    echo - C:\wamp64\bin\mysql\mysql5.7.36\bin\mysql.exe
    echo - C:\wamp64\bin\mysql\mysql8.0.31\bin\mysql.exe
    echo - C:\xampp\mysql\bin\mysql.exe
    pause
    exit /b 1
)

REM Import the database
echo Importing database from localhost_journee_proches.sql...
IF EXIST "C:\wamp64\bin\mysql\mysql9.1.0\bin\mysql.exe" (
    "C:\wamp64\bin\mysql\mysql9.1.0\bin\mysql.exe" -u root journee_proches < localhost_journee_proches.sql
) ELSE IF EXIST "C:\wamp64\bin\mysql\mysql5.7.36\bin\mysql.exe" (
    "C:\wamp64\bin\mysql\mysql5.7.36\bin\mysql.exe" -u root journee_proches < localhost_journee_proches.sql
) ELSE IF EXIST "C:\wamp64\bin\mysql\mysql8.0.31\bin\mysql.exe" (
    "C:\wamp64\bin\mysql\mysql8.0.31\bin\mysql.exe" -u root journee_proches < localhost_journee_proches.sql
) ELSE IF EXIST "C:\xampp\mysql\bin\mysql.exe" (
    "C:\xampp\mysql\bin\mysql.exe" -u root journee_proches < localhost_journee_proches.sql
)

echo Database import completed!
echo If you were prompted for a password and the import failed, try running the script again.
echo You can also import the database manually using phpMyAdmin.
pause

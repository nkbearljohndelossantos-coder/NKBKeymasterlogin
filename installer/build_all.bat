@echo off
REM NKB Manufacturing Credential Provider Automated Build Script
REM Auto-locates Visual Studio and CMake

echo ===========================================================
echo  BUILDING NKB CREDENTIAL PROVIDER (x64 RELEASE)
echo ===========================================================

REM Check for vswhere
for /f "usebackq tokens=*" %%i in (`"%ProgramFiles(x86)%\Microsoft Visual Studio\Installer\vswhere.exe" -latest -products * -requires Microsoft.VisualStudio.Component.VC.Tools.x86.x64 -property installationPath`) do (
    set "VS_DIR=%%i"
)

if not defined VS_DIR (
    echo [ERROR] Visual Studio with C++ tools not found.
    pause
    exit /b 1
)

echo [INFO] Found Visual Studio at: %VS_DIR%

REM Setup environment
if exist "%VS_DIR%\VC\Auxiliary\Build\vcvars64.bat" (
    call "%VS_DIR%\VC\Auxiliary\Build\vcvars64.bat"
)

REM Locate CMake
set "CMAKE_EXE=cmake.exe"
if exist "%VS_DIR%\Common7\IDE\CommonExtensions\Microsoft\CMake\CMake\bin\cmake.exe" (
    set "CMAKE_EXE=%VS_DIR%\Common7\IDE\CommonExtensions\Microsoft\CMake\CMake\bin\cmake.exe"
)

echo [INFO] Using CMake: %CMAKE_EXE%

cd /d "%~dp0\..\credential-provider"

if not exist build (
    mkdir build
)

cd build
"%CMAKE_EXE%" .. -A x64 -DCMAKE_BUILD_TYPE=Release
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] CMake generation failed.
    pause
    exit /b 1
)

"%CMAKE_EXE%" --build . --config Release
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Compilation failed.
    pause
    exit /b 1
)

echo ===========================================================
echo  BUILD SUCCESSFUL!
echo  Compiled DLL: credential-provider\build\bin\Release\NKBCredentialProvider.dll
echo ===========================================================
cd /d "%~dp0"

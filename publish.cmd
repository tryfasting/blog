@echo off
rem Double-click to open the publish tool window (registers manuscripts from desk/ to the blog).
cd /d "%~dp0"
uv run scripts\publish.py %*
if errorlevel 1 pause

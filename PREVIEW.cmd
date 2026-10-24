@echo off
setlocal
if exist "D:\8Z\.venv\Scripts\python.exe" (
  "D:\8Z\.venv\Scripts\python.exe" "%~dp0scripts\serve_lab.py" %*
) else (
  py -3 "%~dp0scripts\serve_lab.py" %*
)

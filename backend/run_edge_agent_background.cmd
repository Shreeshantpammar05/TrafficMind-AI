@echo off
cd /d "D:\trafficmind-ai\backend"
"C:\Users\ajayr\AppData\Local\Programs\Python\Python311\python.exe" -u "D:\trafficmind-ai\backend\ai\trafficmind_edge_agent.py" >> "D:\trafficmind-ai\backend\logs\trafficmind_edge_agent.log" 2>&1
exit /b %ERRORLEVEL%

Set shell = CreateObject("WScript.Shell")
shell.CurrentDirectory = "D:\trafficmind-ai\backend"
exitCode = shell.Run(Chr(34) & "D:\trafficmind-ai\backend\run_edge_agent_background.cmd" & Chr(34), 0, True)
WScript.Quit exitCode

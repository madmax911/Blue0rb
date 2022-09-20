@echo off

prompt #

:reload
echo Starting node %* at %time% ...
node %* server.js
goto reload
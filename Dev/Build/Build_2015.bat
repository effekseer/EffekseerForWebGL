@echo off

rem Enable Visual Studio 2015 environment
call "%VS140COMNTOOLS% \VsDevCmd.bat"

rem emscripten configuration
call emcmake cmake -G "MinGW Makefiles"

rem build
nmake

java -jar ../Bin/compiler.jar --compilation_level WHITESPACE_ONLY --js effekseer.core.js --js ../Source/effekseer.src.js > ../../Release/effekseer.min.js

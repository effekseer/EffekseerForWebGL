java -jar ../Bin/compiler.jar --compilation_level WHITESPACE_ONLY --js ../Source/effekseer.src.js > ../Source/effekseer.src.min.js

Get-Content ../Source/effekseer.core.js, ../Source/effekseer.src.min.js | Set-Content ../../Release/effekseer.min.js

Get-Content ../Source/effekseer.core.js, ../Source/effekseer.src.js | Set-Content ../../Release/effekseer.js

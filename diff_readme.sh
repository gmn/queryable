
diff <(node -p "require('fs').readFileSync('README.md',{encoding:'utf8'})") <(node -p "var o = require('fs').readFileSync('./package.json',{encoding:'utf8'}); (function(ret){console.log(JSON.parse(ret).readme)})(o)")

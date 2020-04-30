const generators = require("./generators");

var myArgs = process.argv.slice(2);
if(myArgs.length<2)
    console.error("usage generate <type> <nom> <path>");

let type = myArgs[0];
let name = myArgs[1];

let path=(myArgs[2]||'')+'/';
if(path.search('application')==-1)
    path = '/applications/'+path;
path = process.cwd()+'/'+path;

path = path.replace("//","/");

let force = myArgs[3]||'';

console.log("generator..");
generators.generate(type,path,name,force)
.then(text => {
    console.log("end generator");
})
.catch(err => {
    console.error("end generator");
});
#!/usr/bin/env node

const generators = require("./generators");

const run = async () => {

    var myArgs = process.argv.slice(2);
    if(myArgs.length<2)
    {
        console.error("This tool generates code. The general form is :\nnode generate.js <type> <other params>\n\n");

        const lines = generators.usage("> node generate.js ").then(
            lines => console.log("Supported generator commands :\n"+lines.join("\n"))
        );

        return;
    }

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
};

run();
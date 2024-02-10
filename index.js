#!/usr/bin/env node

const generators = require("./generators");

const { execSync } = require('child_process');
const npmVersion = execSync('npm --version').toString().trim();

const run = async () => {

    console.log(`npm version: ${npmVersion}`);
        
    var myArgs = process.argv.slice(2);
    if(myArgs.length<2)
    {
        console.error("This tool generates code. The general form is :\nnode generate.js <type> <other params>\n\n");

        const lines = generators.usage("> nxg ").then(
            lines => console.log("Supported generator commands :\n"+lines.join("\n"))
        );

        return;
    }

    let type = myArgs[0];
    let name = myArgs[2];

    let path=(myArgs[1]||'');
    if((type!="client") && (path.search('application')==-1))
        path = '/applications/'+path;

    if(type == 'client')
        name = myArgs[1];    
        
    path = process.cwd()+'/'+path;
    path = path.replace("//","/");

    let force = myArgs[3]||'';

    let params = {
        type,
        name,
        path,
        
        srcDir : __dirname,
        toDir : process.cwd()+'/',
        force,
        args: myArgs
    }

    console.log(`Generating type=${type}, name=${name}, path=${path}, force=${force}`);
        
    // generators.generate(type,path,name,force)
    generators.generate(type,params)
    .then(text => {
        console.log("end generator");
    })
    .catch(err => {
        console.error("end generator");
    });
};

run();
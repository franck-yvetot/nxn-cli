#!/usr/bin/env node

const generators = require("./generators");

const { execSync } = require('child_process');
const npmVersion = execSync('npm --version').toString().trim();

const run = async () => {

    console.log(`npm version: ${npmVersion}`);
        
    var myArgs = process.argv.slice(2);
    if(myArgs.length<2 && myArgs[0]!="init")
    {
        console.error("This tool generates code. The general form is :\nnode generate.js <type> <other params>\n\n");

        const lines = generators.usage("> nxg ").then(
            lines => console.log("Supported generator commands :\n"+lines.join("\n"))
        );

        return;
    }

    let type = myArgs[0];

    let appId;
    let name = myArgs[1];
    let force;
    
    aNames = name.split("@");
    if(aNames.length > 1)
    {
        name = aNames[0];
        appId = aNames[1];
        force = myArgs[2]||'';
    }
    else
    {
        // name = 
        name  = myArgs[2];
        appId = myArgs[1] || '';
        force = myArgs[3] || '';        
    }

    let path = appId;
    if((type!="client") && (path.search('application')==-1))
        path = '/applications/'+path;

    if(type == 'client')
        name = myArgs[1];    
        
    path = process.cwd()+'/'+path;
    path = path.replace("//","/");

    let params = {
        type,
        name,
        appId,
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
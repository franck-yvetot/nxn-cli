const fs = require('@nxn/files');
const _path_ = require('path');
const strings = require('@nxn/ext/string.service');

const template = `{
    "$variables": {
        "PORT": 3000
    },

    "middleware" : 
    {
        "defaultPath":"@nxn/boot/middleware/$id",
        "load" : "ENV,debug,express,CORS2,JSON",

        "configuration" : {
            "express":{
                "port":"\${PORT}",
                "message":"Express server run on port"
            },

            "cors2" : {
                "verbs": "GET,POST,PUT,DELETE"
            },

            "env" : {
            },

            "debug" : {
                "path" : "@nxn/debug",
                "DEBUG": "*",
                "DEBUG_COLORS":1
            }
        }
    },

    "services" : {
        "defaultPath":"",
        
        "load" : "",

        "configuration" : {
        }
    },
    
    "nodes" : {
        "defaultPath":"",
        
        "load" : "",

        "configuration" : {
        }
    },
    
    "routes" : {
        "defaultPath":"applications/$id/routes/$id.routes",
        "load" : "",

        "configuration" : {       
        }            
    },

    "run" : {
        "load" : "express"
    }
}
`;

const template_yaml = `

# add variables here to be used in config as "${VAR}"
$variables:
  PORT: 3000

# express middleware section
middleware:
  defaultPath: "@nxn/boot/middleware/$id"
  load: ENV,debug,express,CORS2,JSON
  configuration:
    express:
      port: "${PORT}"
      message: Express server run on port
    cors2:
      verbs: GET,POST,PUT,DELETE
    env: {}
    debug:
      path: "@nxn/debug"
      DEBUG: "*"
      DEBUG_COLORS: 1

# services components
services:
  load: 'all'
  # defaultPath: applications/$id/services/$id.service
  configuration:

# nodes components (for processing chains)
nodes:
  load: '*'
  configuration:

# express routers
routes:
  # route default path
  # defaultPath: applications/$id/routes/$id.route
  load: '*'
  configuration:

# to be loaded at startup
run:
  load: express
`;

const appT = `
// module alias : allow access to applications services from config files
// install : npm i --save module-alias
const {configSce,bootSce} = require("@nxn/boot");

// init config reader from client data
var myArgs = process.argv.slice(2);
let client = myArgs[0] || 'default';
global.__clientDir = \`\${__dirname}/client_data/\${client}/\`;

// directory where to store temporary files used for a client app
// should not be gittable
global.__dataDir = __clientDir+"/.data/";

// get variables to be injected into the config as \${my_variable}
// variables are dependent from the environment
const env = myArgs[2] || process.env.NODE_ENV;
const configPath = [__clientDir+'/env/'+env,__clientDir,__dirname];


// read main config defining the modules (middleware, services, nodes, run, test)
let configName = myArgs[1] || 'config';
if(configName.search(/[.](json|ya?ml)/)==-1)
    configName = 'config_'+configName;

bootSce.run(configName,configPath);
`;

class CltGenerator
{
    init(config) {

    }

    name() {
        return "client";
    }

    usage(pad) {
        return {
            usage:"CLT_NAME",
            description:
pad+`Create a client directory in /client_data and adds a default config file in json.`

        };
    }


    async generateApp(path,force) {

        let fullPath = path+='/index.js';
        fullPath = fullPath.replace("//","/");

        let s = appT;
        if(await fs.existsFileAsync(fullPath) && (force!='force')) {
            console.error("this index.js already exists "+fullPath);
            return false;
        }

        try {
            fs.writeFileAsync(fullPath,s,true);    
        } catch (error) {
            console.error(error);
        }

        console.log("Generated client data folder "+fullPath);
        return true;
    }

    async generate(path,name,force) {

        this.generateApp(path,force);

        let fullDirPath = path;
        let cltPath = path+'/client_data/'+name;

        let fullPath = path+'/client_data/'+name+'/config_default.json';
        fullPath = fullPath.replace("//","/");

        fs.copyDirSync("./default", cltPath);

        let s = template;
        if(await fs.existsFileAsync(fullPath) && (force!='force')) {
            console.error("this client configuration already exists in "+fullPath);
            return false;
        }

        try {
            fs.writeFileAsync(fullPath,s,true);    
        } catch (error) {
            console.error(error);
        }

        console.log("Generated client data folder "+fullPath);
        return true;
    }
}

module.exports = new CltGenerator();

const fs = require('@nxn/files');
const _path_ = require('path');
const strings = require('@nxn/ext/string.service');

const template = `{
    "middleware" : 
    {
        "defaultPath":"@nxn/boot/middleware/$id",
        "load" : "ENV,debug,express,CORS2,JSON",

        "configuration" : {
            "express":{
                "port":3000,
                "message":"Express server run on port"
            },

            "cors2" : {
                "verbs": "GET,POST,PUT,DELETE"
            },

            "env" : {
            },

            "debug" : {
                "path" : "@nxn/debug",
                "DEBUG": "*,-VIDEO_SCE:Parser,VIDEO_SCE:Index,-retry-request,-GBUCKET,",
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

    async generate(path,name,force) {

        let fullPath = path+='/client_data/'+name+'/config.json';
        fullPath = fullPath.replace("//","/");

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

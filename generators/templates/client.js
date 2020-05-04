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

    usage(pad) {
        return {
            usage:"CLT_NAME",
            description:
pad+`Create a client directory in /client_data and adds a default config file in json.`

        };
    }

    async generate(path,name,force) {

        let aName = name.split('/');
        let basename = aName.pop();

        let path2 = aName.join('/');
        path = path+'/'+path2;
        
        basename = _path_.basename(basename);
        let matches = basename.match('/([^.]+)[.]service/');
        if(matches)
            basename=matches[1];
        
        if(path.search('/services')==-1 && path.search('node_modules')==-1)
            path = path+'/services';

        let fullPath = path+'/'+basename+'.service.js';
        fullPath = fullPath.replace("//","/");

        let s = template;
        let Basename = strings.toCamelCase(basename,true);

        s = s.replace(/MY_SCE/g,Basename);

        if(await fs.existsFileAsync(fullPath) && (force!='force')) {
            console.error("this service already exists");
            return false;
        }

        try {
            fs.writeFileAsync(fullPath,s,true);    
        } catch (error) {
            console.error(error);
        }

        console.log("Generated service "+fullPath);
        return true;
    }
}

module.exports = new CltGenerator();

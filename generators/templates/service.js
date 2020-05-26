const fs = require('@nxn/files');
const _path_ = require('path');
const strings = require('@nxn/ext/string.service');

const template = `const debug = require("@nxn/debug")('MY_SCE');

class MY_SCESce
{
    constructor() {
        this.config = {};
    }

    init(config) {
        this.config = config;
    }

    test(row) {
        console.log("test ok");
    }
}

module.exports = new MY_SCESce();
`;

class Generator
{
    name() {
        return "service";
    }

    usage(pad=' ') {
        return {
            usage:"APP SCE",
            description:
pad+`adds a service class in an application, code is generated in /applications/APP/SCE.service.js,
${pad}where APP and SCE are the names of the application and service.
${pad}The application folder is created if it doesn't exist yet.
${pad}The service can be configured if added to the "service/configuration" section of the config file in the client data.
`
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

module.exports = new Generator();

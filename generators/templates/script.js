const fs = require('@nxn/files');

const template = `
const debug = require("@nxn/debug")('MY_SCRIPT');

class MY_SCRIPT
{
    constructor() {
    }

    async run(config) {

        // init script from config
        this.init(config);

        // here : do the job
        debug.log("Executing script MY_SCRIPT");

    }

    async init(config) {
        this.config = config;

        // init service using the config
    }
}

module.exports = new MY_SCRIPT();
`;

class Generator
{
    name() {
        return "script";
    }

    usage(pad=' ') {
        return {
            usage:"APP COMMANDE",
            description:
pad+`adds a script class in an application, code is generated in /applications/APP/scripts/COMMANDE.js,
${pad}where APP and COMMANDE are the names of the application and command.
${pad}The application folder is created if it doesn't exist yet.
${pad}The command can be executed if added to the "run/configuration" section of the config file in the client data.
`
        };
    }

    async generate(path,name,force) {
        let aName = name.split('/');
        let basename = aName.pop();

        let path2 = aName.join('/');
        path = path+'/'+path2;

        basename = _path_.basename(basename);
        let matches = basename.match('/([^.]+)[.]script/');
        if(matches)
            basename=matches[1];
        
        if(path.search('/scripts')==-1 && path.search('node_modules')==-1)
            path = path+'/scripts';

        let fullPath = path+'/'+basename+'.js';
        fullPath = fullPath.replace("//","/");

        var s = template;
        s = s.replace(/MY_SCRIPT/g,name);
        
        if(await fs.existsFileAsync(fullPath) && (force!='force')) {
            console.error("this script already exists");
            return false;
        }

        try {
            fs.writeFileAsync(fullPath,s,true);    
        } catch (error) {
            console.error(error);
        }

        console.log("Generated script "+fullPath);
        return true;
    }
}

module.exports = new Generator();
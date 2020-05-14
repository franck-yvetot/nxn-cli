const fs = require('@nxn/files');
const _path_ = require('path');
const strings = require('@nxn/ext/string.service');

const template = `
const debug = require("@nxn/debug")('MY_SCE');
const FlowNode = require("@nxn/boot/node");

class MY_SCENode extends FlowNode
{
    constructor() {
        super();
    }

    async init(config,ctxt,...receivers) {
        if(!this.config)
            this.config = config;

        this.registerReceivers(receivers);
    }

    name() {
        return this.config.name ||"MY_SCE";
    }

    async processMessage(message) {

        try {

            // do something here...

            if(this.canSendMessage()) {
                try {
                    await this.sendMessage(message);
                } catch (error) {
                    debug.log("ERROR :"+error.message+error.stack);
                }
            }
        }

        catch(error) {
            let message = error.message || error;
            let code = parseInt(error.code||500, 10) || 500;
            debug.error(error.stack||error);
        }        
    }

}

module.exports = new MY_SCENode();
`;


class Generator
{
    usage(pad=' ') {
        return {
            usage:"APP SCE",
            description:
pad+`adds a flow node class in an application, code is generated in /applications/APP/SCE.service.js,
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

        console.log("Generated node service "+fullPath);
        return true;
    }
}

module.exports = new Generator();
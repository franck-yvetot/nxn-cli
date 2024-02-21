const fs = require('@nxn/files');
const _path_ = require('path');
const strings = require('@nxn/ext/string.service');

const BaseGenerator = require("./_baseGenerator")

const template = `// @ts-check
const debug = require("@nxn/debug")('MY_SCE');

const FlowNode = require("@nxn/boot/node");

/** my service description here */
class MY_SCESce extends FlowNode
{
    constructor(instName) {
        super(instName);
    }

    /** init the service with a config */
    async init(config,ctxt,...injections) {
        super.init(config,ctxt,injections); 

        // your service initialisation code here

        // get other injection
        this.otherSce = this.getInjection('other_sce');
    }

    isOk() 
    {
        // return this.otherSce && this.otherSce.isOk();
        return super.isOk();
    }

    test(row) {
        console.log("test ok");
    }
}

module.exports = new MY_SCESce();

// export types for jsdoc type checks
module.exports.MY_SCESce = MY_SCESce;
`;

class Generator extends BaseGenerator
{
    constructor() {
        super("crud");
    }

    usage(pad=' ') {
        return {
            usage:"<NAME>@<APPLICATION>",
            description:
pad+`adds a CRUD service class for model in an application, code is generated in /applications/APP/SCE.service.js,
${pad}where APP and SCE are the names of the application and service.
${pad}The application folder is created if it doesn't exist yet.
${pad}The service can be configured if added to the "service/configuration" section of the config file in the client data.
`
        };
    }

    async generate(params) 
    {
        let {name,appId,force,path} = params;

        let aName = name.split('/');
        let basename = aName.pop();
        let forceCreate = (force == 'force');

        const template = require("./templates/crud_sce.tpl");        

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
        let BasenameSingular = Basename;

        this.createFileFromTemplate(
            name,
            appId,
            "service",
            forceCreate,
            template,
            "services",
            "js",
            (s,name,fullPath,appId) => 
                {
                    return s
                        .replace(/GFileSce/g,Basename+"Sce")
                        .replace(/MODEL_FILE/g,basename)
                        .replace(/MODEL_NAME/g,BasenameSingular)
                    ;
                });        

        // now update main configuration
        let app = appId;
        let upath = basename+"@"+app;
        let sce = {
            upath,
        }

        await this.addToConfig(basename, sce,"services",params);

        console.log("Generated crud service "+fullPath);
        return true;
    }  
}

module.exports = new Generator();
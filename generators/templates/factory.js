const fs = require('@nxn/files');
const _path_ = require('path');
const strings = require('@nxn/ext/string.service');

const template = `const debug = require("@nxn/debug")('MY_SCE');

const FlowNode = require("@nxn/boot/node");

/** my service description here */
class MY_SCESce extends FlowNode
{
    constructor(instName) {
        super(instName);
    }

    async init(config,ctxt,...injections) {
        super.init(config,ctxt,injections); 

        // your service initialisation code here

        // get other injection
        this.otherSce = this.getInjection('other_sce');
    }

    isOk() 
    {
        return this.otherSce && this.otherSce.isOk();
    }    

    test(row) {
        console.log("test ok");
    }
}

// Service fcatory for instanciating a service instance for each 
// declared service in th enxn config.
class MY_SCEFactory
{
    constructor () {
        this.instances={};
    }

    /**
     * get resource service instance
     * @param {string} instName 
     * @returns {MY_SCESce}
     */
    getInstance(instName=null) {
        if(!instName)
            return new MY_SCESce();

        if(this.instances[instName])
            return this.instances[instName];

        return (this.instances[instName] = new MY_SCESce(instName));
    }
}

// factory instance, nxn then calls getInstance() and init on the instance, if exists.
module.exports = new MY_SCEFactory();

// add exported types here for jsdoc/typescript pupose
module.exports.MY_SCESce = MY_SCESce;
`;

class Generator
{
    name() {
        return "service";
    }

    usage(pad=' ') {
        return {
            usage:"SCE APP",
            description:
pad+`adds a service class in an application, code is generated in /applications/APP/services/SCE.service.js,
${pad}where APP and SCE are the names of the application and service. A factory is generated for 
${pad} getting multiple instances of a service.
${pad}The application folder is created if it doesn't exist yet.
${pad}The service can be configured if added to the "service/configuration" section of the config file in the client data.
`
        };
    }

    async generate(params) 
    {
        const {name,force,path} = params;
        let aName = name.split('/');
        let basename = aName.pop();

        let path2 = aName.join('/');
        path = path+'/'+path2;
        
        basename = _path_.basename(basename);
        let matches = basename.match('/([^.]+)[.]service/');
        if(matches)
            basename=matches[1];
        
        if(path.search('/services')==-1 && path.search('node_modules')==-1)
            path = path+'services';

        let fullPath = path+'/'+basename+'.service.js';
        fullPath = fullPath.replace("[/][/]","/");

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

        console.log("Generated factory "+fullPath);
        return true;
    }
}

module.exports = new Generator();

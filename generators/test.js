const fs = require('@nxn/files');
const _path_ = require('path');
const strings = require('@nxn/ext/string.service');
const BaseGenerator = require("./_baseGenerator")

const template = `const debug = require("@nxn/debug")('MY_SCE');
var assert = require('assert');
const {bootSce} = require("@nxn/boot");

const FlowNode = require("@nxn/boot/node");

class MY_SCE_TestSce extends FlowNode
{
    constructor() {
        super();
    }

    init(config,ctxt,...injections)
    {
        super.init(config,ctxt,injections);

        /** @type {import('../services/MY_SCE_BASE.service').MY_SCESce} */
        this.MY_SCE_BASE = 
            this.getInjection('MY_SCE_BASE'); // get injection
        
        if(!(config.active === false))
            this.run();
    }

    isOk() 
    {
        return this.MY_SCE_BASE && this.MY_SCE_BASE.isOk();
    }    

    async run() 
    {
        try 
        {
            // await for services init to finish
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // init tests data
            let sce = this.MY_SCE_BASE;

            let token = this.config.token || process.env.TEST_TOKEN; // use token from config or env if provided

            /** @type {import('../types/types').gUser} */
            let user = {email:"me@mondomaine.com", gToken:null};

            // search for groups starting with dev
            debug.log("test 0 : executing...");
            try 
            {
                assert.ok(sce,"sce injection not valid");
                assert.ok(sce.isOk(),"sce injection not valid");

                // add here your tests

                debug.log("test  ok");
            } 
            catch (error) 
            {
                throw error;               
            }

            debug.log("ALL TESTS COMPLETED WITH SUCCESS!!");                
        } 
        catch (error) 
        {
            debug.log("TEST FAILURE :  exception "+error.message||error);    
        }    
    }
}

module.exports = new MY_SCE_TestSce();
`;

class Generator extends BaseGenerator
{
    name() {
        return "test";
    }

    usage(pad=' ') {
        return {
            usage:"<NAME>@<APPLICATION>",
            description:
pad+`adds a test class in an application, code is generated in /applications/APPLICATION/tests/NAME.test.js,
${pad}where APPLICATION and NAME are the names of the application and service to test.
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

        let path2 = aName.join('/');
        path = path+'/'+path2;
        
        basename = _path_.basename(basename);
        let matches = basename.match('/([^.]+)[.]test/');
        if(matches)
            basename=matches[1];
        
        if(path.search('/tests')==-1 && path.search('node_modules')==-1)
            path = path+'/tests';

        let fullPath = path+'/'+basename+'.test.js';
        fullPath = fullPath.replace("//","/");

        let s = template;
        let Basename = strings.toCamelCase(basename,true);

        // replace path name
        s = s.replace(/MY_SCE_BASE/g,basename);

        // replace class name
        s = s.replace(/MY_SCE/g,Basename);

        if(await fs.existsFileAsync(fullPath) && (force!='force')) 
        {
            console.error("this test service already exists");
        }
        else {
            try {
                fs.writeFileAsync(fullPath,s,true);    
            } catch (error) {
                console.error(error);
            }    
        }

        // now update main configuration
        let app = params.appId;
        let upath = basename+"@"+app;
        let sce = {
            upath,
            injections:
            {
            }            
        }

        sce.injections[basename] = basename;

        await this.addToConfig(basename+"_test", sce,"tests",params);

        console.log("Generated test service "+fullPath);
        return true;
    }
}

module.exports = new Generator();

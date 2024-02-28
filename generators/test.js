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

        /** @type {import('../MY_TYPEs/MY_SCE_BASE.MY_TYPE').MY_SCESce} */
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
            // init tests data
            let sce = this.MY_SCE_BASE;

            let token = this.config.token || process.env.TEST_TOKEN; // use token from config or env if provided

            /** @type {import('../types/types').gUser} */
            let user = {email:"me@mondomaine.com", gtoken:token};

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
        let basepath = path+'/'+path2;
        
        basename = _path_.basename(basename);
        let matches = basename.match('/([^.]+)[.]test/');
        if(matches)
            basename=matches[1];
        
        if(basepath.search('/tests')==-1 && basepath.search('node_modules')==-1)
            path = basepath+'/tests';

        let fullPath;

        let fullPathSce = basepath+'/services/'+basename+'.service.js';
        let fullPathNode = basepath+'/nodes/'+basename+'.node.js';

        let s = template;
        let Basename = strings.toCamelCase(basename,true);
        let baseNameTest;

        if(await fs.existsFileAsync(fullPathNode)) 
        {
            fullPath = path+'/'+basename+'_node.test.js';
            fullPath = fullPath.replace("//","/");
            baseNameTest = basename+'_node';

            //  NOE Exists
            s = s.replace(/MY_SCESce/g,Basename+"Node");           

            // replace path name
            s = s.replace(/MY_SCE_BASE/g,basename);

            s = s.replace(/MY_TYPE/g,"node");
            
            // replace path name
            s = s.replace(/MY_SCE_BASE/g,basename);

            // replace class name
            s = s.replace(/MY_SCE/g,Basename);

            // replace class name suffix
            s = s.replace(/_TestSce/g,"_TestNode");

        }
        else
        {
            // default : test for a service
            fullPath = path+'/'+basename+'.test.js';
            fullPath = fullPath.replace("//","/");
            baseNameTest = basename;

            s = s.replace(/MY_SCESce/g,Basename+"Sce");

            // replace path name
            s = s.replace(/MY_SCE_BASE/g,basename);

            s = s.replace(/MY_TYPE/g,"service");
            
            // replace path name
            s = s.replace(/MY_SCE_BASE/g,basename);

            // replace class name
            s = s.replace(/MY_SCE/g,Basename);
        }

        if(await fs.existsFileAsync(fullPath) && (force!='force')) 
        {
            console.error("this test service already exists");
        }
        else 
        {
            try 
            {
                fs.writeFileAsync(fullPath,s,true);    
            } 
            catch (error) 
            {
                console.error(error);
            }    
        }

        // now update main configuration
        let app = params.appId;
        let upath = baseNameTest+"@"+app;
        let sce = {
            upath,
            injections:
            {
            }            
        }

        sce.injections[basename] = basename;

        await this.addToConfig(baseNameTest+"_test", sce,"tests",params);

        console.log("Generated test service "+fullPath);
        return true;
    }
}

module.exports = new Generator();

const fs = require('@nxn/files');
const _path_ = require('path');
const strings = require('@nxn/ext/string.service');
const BaseGenerator = require("./_baseGenerator")

const template = `const debug = require("@nxn/debug")('MY_ROUTE');

const FlowNode = require("@nxn/boot/node");

class MY_ROUTERoute extends FlowNode
{

    /** service controller
     *  @type {import('../services/MY_SCE_BASE.service').MY_SCESce} 
     **/
    MY_SCE_BASESce;

    constructor() {
        super();
    }

    init(config,express,...injections)
    {
        super.init(config,{express},injections);   

        // URI
        this.baseUri = this.config.url||'/';
        debug.log("init MY_ROUTE routes  on "+this.baseUri);

        // AUTH
        // if not authenticated, remove this injection (here and in isOk() )
        this.auth =  this.getInjection('auth') || 
            { authenticate:(req,res,next)=>{ return (req,res,next) => { next(); }} }        

        // init routes
        const router = express.Router();
        this.routes(router);

        return router;
    }

    isOk() 
    {
        return this.baseUri && this.auth && this.auth?.isOk();
    }

    // init routes
    routes(router) 
    {
        const auth = this.auth;

        // endpoint w/ auth
        router.get('/', auth.authenticate(), async (req, res)=> {

            try 
            {
                
                res.send("OK");    
            }
            catch(error) {
                let message = error.message || error;
                let code = parseInt(error.code||500, 10) || 500;
                res.status(code).send({code,error:message});
                debug.error(error.stack||error);
            }    
        });

        // endpoint w/o auth
        router.get('/xx', auth.authenticate(), async (req, res)=> {

            try {
                
                res.send("OK");    
            }
            catch(error) {
                let message = error.message || error;
                let code = parseInt(error.code||500, 10) || 500;
                res.status(code).send({code,error:message});
                debug.error(error.stack||error);
            }    
        });        
    }
}

module.exports = new MY_ROUTERoute();
`;

class Generator extends BaseGenerator
{
    name() {
        return "route";
    }

    usage(pad=' ') {
        return {
            usage:"<NAME>@<APPLICATION>",
            description:
pad+`adds a router class in an application, code is generated in /applications/APP/routes/ROUTE.service.js,
${pad}where APP and ROUTE are the names of the application and route.
${pad}If ROUTE argument is not provided, it defaults to the APP name.
${pad}The application folder is created if it doesn't exist yet.
${pad}The route can be configured if added to the "routes/configuration" section of the config file in the client data.
`
        };
    }

    async generate(params) 
    {
        let {name,force,path} = params;

        let aName = name.split('/');
        let basename = aName.pop();

        var s = template;

        let Basename = strings.toCamelCase(basename,true);

        // replace path name
        s = s.replace(/MY_ROUTE_BASE/g,basename);
        s = s.replace(/MY_SCE_BASE/g,basename);

        // replace class name
        s = s.replace(/MY_ROUTE/g,Basename);
        s = s.replace(/MY_SCE/g,Basename);

        if(path.search('application')==-1)
            path = '/applications/'+path;

        if(path.search('/routes')==-1)
            path = path+'/routes';

        let fullPath = path+'/'+name+'.route.js';
        fullPath = fullPath.replace("//","/");
        
        if(await fs.existsFileAsync(fullPath) && (force!='force')) {
            console.error("this route already exists");
        }
        else
        {
            try 
            {
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
            url:"/"+app+"/"+basename,
            injections: {
            }
        }
        sce.injections[basename+"Sce"] = basename;

        await this.addToConfig(basename+"_route", sce,"routes",params);

        console.log("Generated route "+fullPath);
        return true;
    }
}

module.exports = new Generator();

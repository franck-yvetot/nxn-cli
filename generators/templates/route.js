const fs = require('@nxn/files');

const template = `const debug = require("@nxn/debug")('MY_ROUTE');

const FlowNode = require("@nxn/boot/node");

class MY_ROUTERoute extends FlowNode
{
    constructor() {
    }

    init(config,express,...injections)
    {
        super.init(config,{express},injections);   

        // URI
        this.baseUri = this.config.url||'/';
        debug.log("init MY_ROUTE routes  on "+baseUri);

        // AUTH
        // if not authenticated, remove this injection (here and in isOk() )
        this.auth =  this.getInjection('auth');

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

class Generator
{
    name() {
        return "route";
    }

    usage(pad=' ') {
        return {
            usage:"ROUTE APP",
            description:
pad+`adds a router class in an application, code is generated in /applications/APP/routes/ROUTE.service.js,
${pad}where APP and ROUTE are the names of the application and route.
${pad}If ROUTE argument is not provided, it defaults to the APP name.
${pad}The application folder is created if it doesn't exist yet.
${pad}The route can be configured if added to the "routes/configuration" section of the config file in the client data.
`
        };
    }

    async generate(path,name,force) {

    var s = template;
    s = s.replace(/MY_ROUTE/g,name);

    if(path.search('application')==-1)
        path = '/applications/'+path;

    if(path.search('/routes')==-1)
        path = path+'/routes';

    let fullPath = path+'/'+name+'.route.js';
    fullPath = fullPath.replace("//","/");
    
    if(await fs.existsFileAsync(fullPath) && (force!='force')) {
        console.error("this route already exists");
        return false;
    }

    try {
        fs.writeFileAsync(fullPath,s,true);    
    } catch (error) {
        console.error(error);
    }

    console.log("Generated route "+fullPath);
    return true;
    }
}

module.exports = new Generator();

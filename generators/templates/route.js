const fs = require('@nxn/files');

const template = `
const debug = require("@nxn/debug")('MY_ROUTE');

class MY_ROUTESce 
{
    constructor() {
    }

    init(config,express,injections)
    {
        const router = express.Router();

        router.get('/', async (req, res)=> {

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

        return router;
    }
}

module.exports = new MY_ROUTESce();
`;

class Generator
{
    name() {
        return "route";
    }

    usage(pad=' ') {
        return {
            usage:"APP ROUTE",
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

const fs = require('@nxn/files');
const _path_ = require('path');
const strings = require('@nxn/ext/string.service');

const template = `
class MY_SCRIPT
{
    init(config,ctxt) 
    {
        ctxt.app.use((err, req, res, next) => 
        {
            // your middleware code here...
            next();
        });
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
            usage:"<NAME>@<APPLICATION>",
            description:
pad+`adds a middleware class in an application, code is generated in /applications/APP/middleware/MID.middleware.js,
${pad}where APP and MID are the names of the application and command.
${pad}The application folder is created if it doesn't exist yet.
${pad}The command can be executed if added to the "middleware/configuration" section of the config file in the client data.
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
        let matches = basename.match('/([^.]+)[.]middleware/');
        if(matches)
            basename=matches[1];
        
        if(path.search('/middleware')==-1 && path.search('node_modules')==-1)
            path = path+'/middleware';

        let fullPath = path+'/'+basename+'.js';
        fullPath = fullPath.replace("//","/");

        var s = template;
        s = s.replace(/MY_SCRIPT/g,name);
        
        if(await fs.existsFileAsync(fullPath) && (force!='force')) {
            console.error("this middleware already exists");
            return false;
        }

        try {
            fs.writeFileAsync(fullPath,s,true);    
        } catch (error) {
            console.error(error);
        }

        console.log("Generated middleware "+fullPath);
        return true;
    }
}

module.exports = new Generator();
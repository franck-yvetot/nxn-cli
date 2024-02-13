const fs = require('@nxn/files');

const template = `
# =======================
#
# component : MY_COMPONENT
#
# description: 
#
# =======================

services:


routes:


tests:

`;

class ComponentGenerator
{
    init(config) {
    }

    usage(pad=' ') 
    {
        return {
                usage:"APP COMPONENT_NAME",
                description:
    pad+`adds a component configuration in YML in an application.
    ${pad}The application folder is created if it doesn't exist yet.
    ${pad}The service can be configured if added to the "service/configuration" section of the config file in the client data.
    `
            };
    }
    
    name() {
        return "component";
    }

    async generate(params) 
    {
        let {name,force,path} = params;

        let aName = name.split('/');
        let basename = aName.pop();

        var s = template;
        
        // replace path name
        s = s.replace(/MY_COMPONENT/g,basename);

        if(path.search('application')==-1)
            path = '/applications/'+path;

        if(path.search('/components')==-1)
            path = path+'/components';

        let fullPath = path+'/'+name+'.component.yml';
        fullPath = fullPath.replace("//","/");
        
        if(await fs.existsFileAsync(fullPath) && (force!='force')) {
            console.error("this component already exists");
            return false;
        }

        try {
            fs.writeFileAsync(fullPath,s,true);    
        } catch (error) {
            console.error(error);
        }

        console.log("Generated component "+fullPath);
        return true;
    }
}

module.exports = new ComponentGenerator();

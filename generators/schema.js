const fs = require('@nxn/files');

const BaseGenerator = require("./_baseGenerator")
// const template = require("./templates/component.tpl");

class ComponentGenerator extends BaseGenerator
{
    init(config) {
    }

    usage(pad=' ') 
    {
        return {
                usage:"myschema@myapp",
                description:
    pad+`adds a database schema, to be used by @nxn/db model.
    ${pad}The application folder is created if it doesn't exist yet.
    `
            };
    }
    
    name() {
        return "schema";
    }

    async generate(params) 
    {
        let {name, appId,force,path} = params;

        const template = require("./templates/schema.tpl");        

        let aName = name.split('/');
        let basename = aName.pop();
        // let appId = params.args[1];

        let forceCreate = (force == 'force');

        // function for replacing parts of the template
        const replaceCB = (s,name,fullPath,appId) => 
        {
            return s.replace(/MY_SCHEMA/g,name);
        }
        
        return this.createFileFromTemplate(
            name,
            appId,
            "schema",
            forceCreate,
            template,
            "models",
            "yml",
            replaceCB);

    }
}

module.exports = new ComponentGenerator();

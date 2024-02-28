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
                usage:"<NAME>@<APPLICATION>",
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
        let {name, appId,force,path} = params;

        let aName = (name || appId).split('/');
        let basename = aName.pop();

        let forceCreate = (force == 'force');

        await this.createComponent(basename,appId,"component",forceCreate);

        // now update main configuration
        let def = 
        {
            upath: basename+"@"+appId,
        }   
        await this.addToConfig(name+"_component", def,"components",params);         

        return true;
    }
}

module.exports = new ComponentGenerator();

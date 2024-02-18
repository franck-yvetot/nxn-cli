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
                usage:"<MODULE_NAME>@<APPLICATION>",
                description:
    pad+`adds a module configuration in YML in an application.
    ${pad}The application folder is created if it doesn't exist yet.
    `
            };
    }
    
    name() {
        return "module";
    }

    async generate(params) 
    {
        let {name, appId,force,path} = params;

        let aName = name.split('/');
        let basename = aName.pop();
        // let appId = params.args[1];

        let forceCreate = (force == 'force');

        await this.createComponent(basename,appId,"module",forceCreate);

        return true;
    }
}

module.exports = new ComponentGenerator();

const fs = require('@nxn/files');
const yamlEditor = require("../services/yaml_editor");
const BaseGenerator = require("./_baseGenerator")

const template = "graph TD;\n";

class Generator extends BaseGenerator
{
    name() {
        return "mermaid";
    }

    usage(pad=' ') {
        return {
            usage:"",
            description:
pad+`generates a diagram of components of the application in mermaid form.
`
        };
    }

    async generate(params) 
    {
        let {force,path} = params;
        let s = template;

        this.configPath = params.toDir+'/client_data/default/config_default.yml';
        const yamlObj = await yamlEditor.load(this.configPath,false);

        if(yamlObj.routes?.configuration)
        {
            for(let id in yamlObj.routes.configuration) {
                s = this.addDependency(s,id,yamlObj.routes.configuration[id]);
            }
        }

        if(yamlObj.services?.configuration)
        {
            for(let id in yamlObj.services.configuration) {
                s = this.addDependency(s,id,yamlObj.services.configuration[id]);
            }
        }

        if(yamlObj.nodes?.configuration)
        {
            for(let id in yamlObj.nodes.configuration) {
                s = this.addDependency(s,id,yamlObj.nodes.configuration[id]);
            }
        }

        let fullPath = params.toDir+'/dependencies.mmd';
        fullPath = fullPath.replace("//","/");

        try {
            fs.writeFileAsync(fullPath,s,true);    
        } catch (error) {
            console.error(error);
        }

        console.log("Generated mermaid file "+fullPath);
        return true;
    }

    addDependency(s,id,desc) 
    {
        if(desc.injections)
        {
            for(let inj in desc.injections)
            {
                let dep = desc.injections[inj];
                if(dep != inj)
                    s += "    "+id+" -- "+inj+" -->"+dep+";\n"
                else
                    s += "    "+id+" --> "+inj+";\n"
            }
        }
        return s;
    }
}

module.exports = new Generator();

const fs = require('@nxn/files');
const yamlEditor = require("../services/yaml_editor");
const BaseGenerator = require("./_baseGenerator")

const template = `graph TB;
subgraph main

subgraph Application
    direction LR;
    classDef node fill:#eee,stroke:#eee,color:#333
    classDef route fill:#2080D0,stroke:#eee,color:#fff
    classDef nod fill:#C080C0,stroke:#eee,color:#fff
    classDef service fill:#A9C9EB,stroke:#eee,color:#444
`;
const templateEnd = `end

subgraph Legend
    Route:::route
    Service:::service
    Node:::nod
end
end

style Application fill:#fff,stroke:#999,color:#222
style Legend fill:#eee,stroke:#eee,color:#333
style main fill:#eee,stroke:#eee,color:#eee
`;

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
                s = this.addDependency(s,id,yamlObj.routes.configuration[id],'route');
            }
        }

        if(yamlObj.services?.configuration)
        {
            for(let id in yamlObj.services.configuration) {
                s = this.addDependency(s,id,yamlObj.services.configuration[id],'service');
            }
        }

        if(yamlObj.nodes?.configuration)
        {
            for(let id in yamlObj.nodes.configuration) {
                s = this.addDependency(s,id,yamlObj.nodes.configuration[id],'nod');
            }
        }

        s+= templateEnd;

        let fullPath = params.toDir+'/client_data/default/config_default.README.mmd';
        fullPath = fullPath.replace("//","/");

        try {
            fs.writeFileAsync(fullPath,s,true);    
        } catch (error) {
            console.error(error);
        }

        console.log("Generated mermaid file "+fullPath);
        return true;
    }

    addDependency(s,id,desc,cls=null) 
    {
        let name = id;
        if(cls)
            name +=":::"+cls;
        s+="    "+name+"\n";

        if(desc.injections)
        {
            for(let inj in desc.injections)
            {
                let deps = desc.injections[inj];
                let aDep = deps.split(",");
                for(let dep of aDep)
                {
                    if(dep != inj)
                        s += "    "+id+" -- "+inj+" -->"+dep+";\n"
                    else
                        s += "    "+id+" --> "+dep+";\n"
                }
            }
        }
        return s;
    }
}

module.exports = new Generator();

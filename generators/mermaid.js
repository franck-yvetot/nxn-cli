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

DOCUMENTATION_GRAPH

end


style Application fill:#fff,stroke:#999,color:#222
style Documentation fill:#fff,stroke:#999,color:#222
style Legend fill:#eee,stroke:#eee,color:#333
style main fill:#eee,stroke:#eee,color:#eee
`;

const templateDoc = `subgraph Documentation
    direction LR;
    classDef node fill:#eee,stroke:#eee,color:#333
    classDef route fill:#2080D0,stroke:#eee,color:#fff
    classDef nod fill:#C080C0,stroke:#eee,color:#fff
    classDef service fill:#A9C9EB,stroke:#eee,color:#444

`;
const templateDocEnd = `end

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

        let docs = [];

        if(yamlObj.routes?.configuration)
        {
            for(let id in yamlObj.routes.configuration) {
                s = this.addDependency(s,id,yamlObj.routes.configuration[id],'route');
                docs.push(
                    this.addDoc("",id,yamlObj.routes.configuration[id],'route')
                );
            }
        }

        if(yamlObj.services?.configuration)
        {
            for(let id in yamlObj.services.configuration) {
                s = this.addDependency(s,id,yamlObj.services.configuration[id],'service');
                docs.push(
                    this.addDoc("",id,yamlObj.services.configuration[id],'service')
                );
            }
        }

        if(yamlObj.nodes?.configuration)
        {
            for(let id in yamlObj.nodes.configuration) {
                s = this.addDependency(s,id,yamlObj.nodes.configuration[id],'nod');
                docs.push(
                    this.addDoc("",id,yamlObj.nodes.configuration[id],'nod')
                );
            }
        }

        s+= templateEnd;        
    
        let sdoc = templateDoc;
        let chunks = array_chunk(docs, 5);
        let ci = 0;
        sdoc += chunks.map(
            chunk => this.createGraphLine(chunk,ci++)
        ).join(''); // Join the array elements into a single string
        sdoc += templateDocEnd;

        s = s.replace("DOCUMENTATION_GRAPH",sdoc);

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

    /**
     * returns item mmd desc in flow and also in doc
     * @param {*} s 
     * @param {*} id 
     * @param {*} desc 
     * @param {*} cls 
     * @returns {{s,sdoc}}
     */
    addDependency(s,id,desc,cls=null) 
    {
        // header item in flow
        let name = id;
        if(cls == "route")
            s+="    "+name+"(\""+name+"\")";
        else
            s+="    "+name+"[\""+name+"\"]";

        if(cls)
            s +=":::"+cls+"\n";        

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

    createGraphLine(nodes,index,direction="TB")
    {
        let tpl = `
subgraph Documentation_${index}
direction ${direction};
`;
        tpl+= nodes.join("\n");

        tpl += "\nend\n";

        tpl += `style Documentation_${index} fill:#fff,stroke:#fff,color:#fff\n`;

        return tpl;
    }

    /**
     * returns item mmd desc in flow and also in doc
     * @param {*} s 
     * @param {*} id 
     * @param {*} desc 
     * @param {*} cls 
     * @returns {{s,sdoc}}
     */
    addDoc(sdoc,id,desc,cls=null)
    {
        // header item in doc
        let nameDoc = id;
        desc = desc || {};
        if(cls)
        {
            nameDoc +="_doc";        

            let path = desc.upath || desc.path;
            if(cls=="route")
            {
                sdoc+="    "+nameDoc+"(\"<b>"+nameDoc+"</b><br><br>";
                if(path)
                    sdoc+="<i>"+path+"</i><br><br>";
                
                if(desc.description)
                    sdoc+=desc.description;

                sdoc+="\")";                
            }
            else
            {
                sdoc+="    "+nameDoc+"[\"<b>"+nameDoc+"</b><br><br>";
                if(path)
                    sdoc+=path+"<br><br>";
                
                if(desc.description)
                    sdoc+="<i>"+desc.description+"</i>";

                sdoc+="\"]";
            }

            sdoc+=":::"+cls+"\n";
        }

        return sdoc;
    }

}

module.exports = new Generator();


function array_chunk(array, chunkSize) {
    const result = [];
    for (let i = 0; i < array.length; i += chunkSize) {
        result.push(array.slice(i, i + chunkSize));
    }
    return result;
}
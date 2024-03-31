const fs = require('@nxn/files');
const yamlEditor = require("../services/yaml_editor");
const BaseGenerator = require("./_baseGenerator")
const configSce = require('@nxn/config');
const {bootSce} = require("@nxn/boot");

const template = `graph LR;
subgraph main
    direction LR;

    subgraph Application
        direction LR;
        classDef nodeCls fill:#9C57BF,stroke:#eee,color:#fff
        classDef routeCls fill:#2080D0,stroke:#eee,color:#fff
        classDef nodCls fill:#9C57BF,stroke:#eee,color:#fff
        classDef serviceCls fill:#A9C9EB,stroke:#eee,color:#444
        classDef dataCls fill:#73BF67,stroke:#eee,color:#fff        
        classDef localeCls fill:#73BF67,stroke:#eee,color:#fff        
`;

const templateEnd = `end

    subgraph Legend
        Route:::routeCls
        Service:::serviceCls
        Node:::nodCls
        Data:::dataCls
        Locale:::localeCls
    end

end

DOCUMENTATION_GRAPH

style Application fill:#fff,stroke:#999,color:#222
style Legend fill:#eee,stroke:#eee,color:#333
style main fill:#eee,stroke:#eee,color:#eee
`;

const templateOnlyModules = `graph TB;

`;
const templateEndOnlyModules = `
`;

const templateDoc = `subgraph Modules
    direction LR;
    classDef nodeCls fill:#9C57BF,stroke:#eee,color:#fff
    classDef routeCls fill:#2080D0,stroke:#eee,color:#fff
    classDef nodCls fill:#9C57BF,stroke:#eee,color:#fff
    classDef serviceCls fill:#A9C9EB,stroke:#eee,color:#444
    classDef dataCls fill:#73BF67,stroke:#eee,color:#fff
    classDef localeCls fill:#73BF67,stroke:#eee,color:#fff
`;

const templateDocEnd = `end
style Modules fill:#fff,stroke:#999,color:#222

`;


class Generator extends BaseGenerator
{
    name() {
        return "mermaid";
    }

    usage(pad=' ') {
        return {
            usage:"(config file name) flows? modules?",
            description:
pad+`generates a diagram of components of the application in mermaid form.
flows option generates a dependency diagram and modules a list of items in the application.
`
        };
    }

    /**
     * get configuration path in the form of:
     *  client configName env
     * @param {{force,path,args}} params 
     * @returns {{configName,configPath}}
     */
    getPaths(params)
    {
        let {force,path,args,srcDir} = params;
        const myArgs = args;
        let dirname = params.toDir;

        let arg0 = myArgs[0] || "";
        let moduleUpath = arg0.split("@");
        if(moduleUpath.length == 2)
        {
            const configPath = [srcDir+"/applications/"+moduleUpath[1]+"/config/"];

            // set documentation path
            params.docPath = srcDir+"/applications/"+moduleUpath[1]+"/documentation";

            let configName;
            if(moduleUpath[1]==moduleUpath[0])                
                configName = moduleUpath[0]+".module";
            else 
                return {
                    configName:moduleUpath[0]+".component",
                    configPath
                };

            return {
                configName,
                configPath,
                documentationPath:srcDir+"/applications/"+moduleUpath[1]+"/documentation/"+configName
            };
        }

        let client = arg0 || 'default';
        global.__clientDir = `${dirname}/client_data/${client}/`;

        let configName = myArgs[1] || "default";

        // ENV
        const env = myArgs[2] || process.env.NODE_ENV || 'dev';
        const configPath = [global.__clientDir+'/env/'+env,__clientDir,dirname];

        // CONFIG NAME : conf_<config name>.yml files to "run"
        if(configName.search(/config_/)==-1)
            configName = 'config_'+configName;

        return {
            configName,
            configPath,
            documentationPath: __clientDir+"/"+configName
        };
    }

    async generate(params) 
    {
        let {force,path,args} = params;
        let s = template;
        let name = "";

        // display flows and modules?
        let withFlow = false;
        let withModules = false;
        let showOnly = null;
        let args2 = [];
        for(let arg of args)
        {
            if(arg == "mermaid")
                continue;
            if(arg.search(/modules?/i)!=-1)
                withModules = true;
            else if(arg.search(/flows?/i)!=-1)
                withFlow = true;
            else if(arg.search(/show?/i)!=-1)
            {
                let show = arg.split("=");
                if (show?.length==2)
                {
                    showOnly = {}
                    let showvals = show[1].split(",");
                    showvals.forEach(v => {
                        showOnly[v] = true; // Populate showOnly object
                    });
                }
            }
            else 
                args2.push(arg);
        }

        if(!withFlow && !withModules)
            withFlow = true;

        params.args = args2;
        let {configName,configPath,documentationPath} = this.getPaths(params);
        
        // const yamlObj1 = await yamlEditor.load(this.configPath,false);
        // const yamlObj1 = configSce.loadConfig(configName,configPath,process.env);
        let yamlObj = await bootSce.loadConfig(configName,configPath,process.env,false);

        let allNodes = bootSce.getFullConfigurationNodes(false);

        // global doc of all items
        let docs = [];

        // doc by package
        let docPackages = {}
        // let yamlObj = this.loadComponents(yamlObj1,yamlObj1);

        let section = yamlObj.routes && yamlObj.routes.configuration || yamlObj.routes;
        if(section)
        {
            for(let id in section) 
            {
                // add to global flow
                s += this.processItem(id,section[id],
                    'route','routes',
                    docs,docPackages,showOnly,allNodes);
            }
        }

        section = yamlObj.services && yamlObj.services.configuration || yamlObj.services;
        if(section)
        {
            for(let id in section) 
            {
                s += this.processItem(id,section[id],
                    'service','services',
                    docs,docPackages,showOnly,allNodes);
            }
        }

        section = yamlObj.nodes && yamlObj.nodes.configuration || yamlObj.nodes;
        if(section)
        {
            for(let id in section) 
            {
                s += this.processItem(id,section[id],
                    'node','nodes',
                    docs,docPackages,showOnly,allNodes);
            }
        }

        s+= templateEnd;        
    
        // let sdoc = this.getGlobalDoc(docs);
        if(withFlow)
        {
            s = s.replace("DOCUMENTATION_GRAPH","");
            this.saveDoc(s,true,false,documentationPath); 
        }
        
        if(withModules)
        {
            s = templateOnlyModules;
            s += this.getPackagesGraph(docPackages);
            s+= templateEndOnlyModules;
            this.saveDoc(s,false,true,documentationPath); 
        }

        return true;
    }

    loadComponents(config,res) 
    {
        for(let compSection of ["components","modules"])
        {
            if(config[compSection])
            {
                let config2 = config[compSection].configuration || config[compSection];
                for(let k in config2)
                {
                    let node = config2[k];

                    // import routes/services/nodes from component
                    for(let section of ["routes","services","nodes"])
                    {
                        if(node[section])
                            res[section].configuration = 
                            {
                                ...res[section].configuration,
                                ...(node[section].configuration || node[section])
                            }
                    }

                    // load sub components
                    if(node.components || node.modules)
                    {
                        let nodes2 = this.loadComponents(node,res);
                        res = {...res, ...nodes2}
                    }

                    // import other nodes
                    if(k == "routes" || k == "services" || k == "nodes")
                    {
                        res[k].configuration = {...(res[k]||{}),...node}
                    }
                }
            }
        }

        return res;
    }

    saveDoc(s,withFlow,withModules,path) 
    {
        let fullPath = path;        
        if(!withFlow && withModules)
        {
            fullPath += '.modules.README.mmd';
        }
        else
        {
            fullPath += '.README.mmd';
        }

        fullPath = fullPath.replace("//","/");

        try 
        {
            fs.writeFileAsync(fullPath,s,true);    
        } 
        catch (error) 
        {
            console.error(error);
        }

        console.log("Generated mermaid file "+fullPath);
    }

    processItem(id,desc,type,section,docs,docPackages,showOnly,allNodes)
    {
        // filters nodes that requires to be shown by category (ex. log)
        if(!this.isNodeShown(id,showOnly,allNodes))
            return '';

        // add to global flow
        let s = this.getMermaidItem(id,desc,type,showOnly,allNodes);

        // get node documentation (mermaid node)
        let doc = this.getDocItemNode(id,desc,type);

        // add to global list
        docs.push(doc);

        // add to package
        this.addToPackage(doc,desc,docPackages,section)        

        return s;
    }

    /**
     * add node doc to package
     * 
     * @param {string} doc in mmd form
     * @param {*} desc node desc
     * @param {{services:[],routes:[],nodes:[]}} docPackages 
     * @param {"routes"|"services"|"nodes"} section 
     */
    addToPackage(doc,desc,docPackages,section) 
    {
        let pack = this.getNodePackageId(desc);
        if(!docPackages[pack]) {
            docPackages[pack] = {services:[],routes:[],nodes:[]};
        }
        docPackages[pack][section].push(doc);
    }

    /**
     * get Node package by checking its upath or path attribute
     * 
     * @param {{path?,upath?}} desc 
     * @returns {string}
     */
    getNodePackageId(desc)
    {
        // upath based
        if (desc.upath) 
        {
            let pack = desc.upath.split("@");
            if (pack.length > 1) {
                return pack[1];
            }
        }
    
        // path based
        if (desc.path) 
        {
            if (desc.path.startsWith("@nxn/files")) {
                return "nxn/files";
            }
            if (desc.path.startsWith("@nxn/boot")) {
                return "nxn/boot";
            }
            if (desc.path.startsWith("@nxn/boot")) {
                return "nxn/boot";
            }
            let pathParts = desc.path.split("/");
            pathParts.pop(); // Remove the last part (presumably the filename)
            return pathParts.join("/"); // Join the rest of the path
        }
    
        return "other";
    }
    
    /**
     * returns item mmd desc in flow
     * 
     * @param {*} s 
     * @param {*} id 
     * @param {*} desc 
     * @param {*} cls 
     * @returns {string}
     */
    getMermaidItem(id,desc,cls=null,showOnly,allNodes) 
    {
        // header item in flow
        let s = this.getFlowItemHeader(id,desc,cls);

        let injections = this.getInjections(desc,showOnly,allNodes) 
        for(let i=0;i<injections.length;i++)
        {
            let injection = injections[i];
            if(injection.link)
                s += "    "+id+" -- "+injection.link+" -->"+injection.to+";\n"
            else
                s += "    "+id+" --> "+injection.to+";\n"

        }
        /*
        if(desc.injections)
        {
            for(let inj in desc.injections)
            {
                let deps = desc.injections[inj];
                if(deps?.split)
                {
                    let aDep = deps.split(",");
                    for(let dep of aDep)
                    {
                        if(dep != inj)
                            s += "    "+id+" -- "+inj+" -->"+dep+";\n"
                        else
                            s += "    "+id+" --> "+dep+";\n"
                    }
                }
                else if(typeof deps == "Object")
                {

                }
                else                 
                {
                    console.log("missing injections for "+name);
                }
            }
        }
        */
        return s;
    }

    getFlowItemHeader(id,desc,cls=null) 
    {
        let name = id;
        let cls2 = (cls||"")+"Cls";

        const dataCls = "dataCls";
        const localeCls = "localeCls";

        if(cls == "route")
            return "    "+name+"(\""+name+"\"):::"+cls2+"\n";

        if(cls == "service")
        {
            let path = desc.upath || desc.path;

            if(path == "@nxn/db/db_model.service")
                return "    "+name+"[/\""+name+"\"/]:::"+dataCls+"\n";

            if(path == "@nxn/db/locale.service")
                return "    "+name+">\""+name+"\"]:::"+localeCls+"\n";

            if(path == "@nxn/db/mysql.service")
                return "    "+name+"[(\""+name+"\")]:::"+dataCls+"\n";

            if(path == "firestore@googleapi" || path == "@nxn/db/firestore.service")
                return "    "+name+"[(\""+name+"\")]:::"+dataCls+"\n";

        }

        return "    "+name+"[\""+name+"\"]:::"+cls2+"\n";
    }

    /**
     * get injections from node
     * 
     * @param {*} desc node desc 
     */
    getInjections(desc,showOnly,allNodes) 
    {
        let injs = [];

        for(let inj in desc.injections)
        {
            if(inj == "$config")
                continue;

            let deps = desc.injections[inj];
            if(deps?.split)
            {
                let aDep = deps.split(",");
                for(let dep of aDep)
                {
                    if(this.isNodeShown(dep,showOnly,allNodes))
                    {
                        if(dep != inj)
                            injs.push({link:inj,to:dep});
                        else
                            injs.push({link:null,to:dep});
                    }
                }
            }
            else if(typeof deps == "object")
            {
                for(let k in deps) 
                {
                    const dep = deps[k];
                    if(this.isNodeShown(dep,showOnly,allNodes))
                    {
                        injs.push({link:k,to:dep});
                    }
                }
            }
            else                 
            {
                console.log("missing injections for "+desc.id);
            }
        }

        return injs;
    }

    isNodeShown(nodeId,showOnly,allNodes) 
    {
        if(allNodes[nodeId])
        {
            const desc = allNodes[nodeId];

            // active ?
            if(desc.active === false)
                return false;

            // not filtering? ==> ok
            if(!showOnly)
                return true;
            
            // selected ?
            if( desc.show  // node has a show attribute
                && !showOnly[desc.show] // show is selected
            )
                return false;
            
            return true;
        }

        return false;
    }

    /**
     * returns item documentation (in mermaid format) for an item node
     * Displays it name, package and description.
     * Use colour/shape formating of node type (service, route, etc.)
     * 
     * @param {*} id 
     * @param {*} desc 
     * @param {*} cls 
     * @returns {string}
     */
    getDocItemNode(id,desc,cls=null)
    {
        let sdoc = "";

        // header item in doc
        let nameDoc = id;
        desc = desc || {};

        if(cls)
        {
            nameDoc +="_doc";        

            let path = desc.upath || desc.path;
            if(cls=="route")
            {
                let content="<b>"+id+"</b><br><br>";
                if(path)
                    content+="<i>"+path+"</i><br><br>";
                
                if(desc.description)
                  content+=desc.description;
                
                sdoc = this.getDocItem(id,nameDoc,desc,content,cls);
            }
            else
            {
                let content="<b>"+id+"</b><br><br>";
                if(path)
                    content+="<i>"+path+"</i><br><br>";
                
                if(desc.description)
                    content+=desc.description;
                
                sdoc = this.getDocItem(id,nameDoc,desc,content,cls);
            }
        }

        return sdoc;
    }

    getDocItem(id,nameDoc,desc,content,cls=null) 
    {
        let name = id;
        let cls2 = (cls||"")+"Cls";

        const dataCls = "dataCls";
        const localeCls = "localeCls";

        if(cls == "route")
            return "    "+nameDoc+"(\""+content+"\")"+":::"+cls2+"\n";

        if(cls == "service")
        {
            let path = desc.upath || desc.path;

            if(path == "@nxn/db/db_model.service")
                return "    "+nameDoc+"[/\""+name+"\"/]:::"+dataCls+"\n";

            if(path == "@nxn/db/locale.service")
                return "    "+nameDoc+">\""+name+"\"]:::"+localeCls+"\n";

            if(path == "@nxn/db/mysql.service")
                return "    "+nameDoc+"[(\""+content+"\")]"+":::"+dataCls+"\n";

            if(path == "firestore@googleapi" || path == "@nxn/db/firestore.service")
                return "    "+nameDoc+"[(\""+content+"\")]"+":::"+dataCls+"\n";

        }

        return "    "+nameDoc+"[\""+content+"\"]"+":::"+cls2+"\n";
    }    

    /**
     * generate doc for all nodes
     * 
     * @param {*} docs 
     * @returns 
     */
    getGlobalDoc(docs) 
    {
        // header
        let sdoc = templateDoc;

        // group by 5
        let chunks = array_chunk(docs, 5);
        let ci = 0;
        
        // generate line
        sdoc += chunks.map
            (
                chunk => this._createSubGraph(
                    chunk,
                    ci++,
                    "Documentation_"+ci,
                    "TB",
                    "fill:#fff,stroke:#fff,color:#fff")
            ).join(''); // Join the array elements into a single string

        // footer
        sdoc += templateDocEnd;     
        return sdoc;   
    }

    /**
     * generate all packages in a graph
     * 
     * @param {*} docs 
     * @returns 
     */
    getPackagesGraph(docPackages)
    {
        let packagesGraph=[];

        for (let packId in docPackages)
        {
            // create package graph
            let pack = docPackages[packId];

            let packGraph = this.getPackageGraph(packId,pack);

            // push pack
            packagesGraph.push(packGraph);
        }

        // header
        let sdoc = templateDoc;
        
        // add content
        sdoc += packagesGraph.join("\n\n");

        // footer
        sdoc += templateDocEnd;     
        return sdoc;          
    }

    /**
     * get graph for a package
     * 
     * @param {*} packId 
     * @param {*} pack 
     * @returns {string}
     */
    getPackageGraph(packId,pack) 
    {
        let sections = [];

        // count sections in package
        let nbSections = 0;
        for(let sectionId of ["routes","services","nodes"])
        {
            if(pack[sectionId].length)
                nbSections++;
        }   

        let sectionLabels = {
            routes:"Routes",
            services:"Services",
            nodes:"Nodes"
        }

        // add sections
        // NB. we try to fit sections with 5 items per line.
        // if only one section, we stretch it to 5, else 3.
        for(let sectionId of ["routes","services","nodes"])
        {
            let nodes = pack[sectionId];
            if(nodes.length)
            {   
                let maxItemsperline = nbSections ==1 ? 5 : 3;
                let sectionLabel = sectionLabels[sectionId] || sectionId;

                // add section graph for that package
                let sectionGraph = this.getSectionDocGraph(
                    packId,
                    sectionId,
                    sectionLabel,
                    nodes,
                    maxItemsperline);

                sections.push(sectionGraph);
            }    
        }

        // create package graph
        let packGraph = this._createSubGraph(sections,
            1,
            packId,
            "TB",
            "fill:#f0f0f0,stroke:#eee,color:#444");
            
        return packGraph;
    }

    /**
     * build graph for a package section
     * 
     * @param {*} packId 
     * @param {*} sectionId 
     * @param {*} nodeDocs 
     * @param {number} [maxItemsperline=3] 
     * @returns {string}
     */
    getSectionDocGraph(packId,sectionId,sectionLabel,nodeDocs,maxItemsperline=3) 
    {
        // create section content

        // group nodes by 5
        let chunks = array_chunk(nodeDocs, maxItemsperline);
        let ci = 0;

        let id = packId+"_"+sectionId;
        
        // generate line
        let chunksDocs = chunks
            .map(
                chunk => this._createSubGraph(
                    chunk,
                    ci++,
                    id+ci,
                    "TB",
                    "fill:#fff,stroke:#fff,color:#fff")
            )
            .join("\n"); // Join the array elements into a single string

        let sectionContent = chunksDocs;        

        // wrap as a sub graph
        let sectionGraph = this._createSubGraph(
            [sectionContent],
            1,
            packId+":"+sectionId,
            "LR",
            "fill:#f0f0f0,stroke:#eee,color:#444",
            sectionLabel); 
            
        return sectionGraph;
    }


    /**
     * create a line of nodes ("chunk") by adding mermaid nodes to a subgraph
     * 
     * @param {*} nodes list of nodes to add to the line
     * @param {*} index chunk index
     * @param {*} direction mermaid graph direction (TB by deft)
     * @returns {string}
     */
    _createSubGraph(nodes,
        index,
        graphId="Documention",
        direction="TB",
        style="fill:#fff,stroke:#fff,color:#fff",
        graphLabel = null
        )
    {
        graphId = graphId.replace("@","");
        let graphName = graphId;
        if(graphLabel)
            graphName +="[\""+graphLabel+"\"]";

        let tpl = `
subgraph ${graphName}
direction ${direction};
`;
        tpl+= nodes.join("\n");

        tpl += "\nend\n";

        tpl += `style ${graphId} ${style}\n`;

        return tpl;
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
const { app } = require('@nxn/boot/boot.service');
const fs = require('@nxn/files');
const yamlEditor = require("../services/yaml_editor");

class BaseGenerator
{
    constructor(t) {
        this.type = t;
    }

    name() {
        return this.type;
    }

    async addToConfig(name, obj,section,params) 
    {
        let appId = params.appId;
        let id = name;

        if( section != "modules")
        {
            if(params.type != "component")
            {
                // most objects to generate => search their parent component first, then module

                if(await this.existsComponent(appId,"component",params.name))
                {
                    return await this.addToComponent(name, obj,section,params,"component",params.name);
                }
        
                if(await this.existsComponent(appId,"module",appId))
                {
                    return await this.addToComponent(name, obj,section,params,"module",appId);
                }    
            }
            else
            {
                // for a component => search their module as we usually add components in modules..
                if(await this.existsComponent(appId,"module",appId))
                {
                    return await this.addToComponent(name, obj,section,params,"module",appId);
                }    

            }

    
            // in case we have a component isntead of a module, use it (unusal..)
            if(await this.existsComponent(appId,"component",appId))
            {
                return await this.addToComponent(name, obj,section,params,"component",appId);
            }
    
            if(false &&  await this.createComponent(appId,appId,"module"))
            {
                return await this.addToComponent(name, obj,section,params,"module",appId);
            }
        }

        // otherwise, add to main configuration
        this.configPath = params.toDir+'/client_data/default/config_default.yml';
        console.log("Registers "+params.type+" "+name+" in config: "+ this.configPath);

        let yamlObj = await yamlEditor.load(this.configPath,true);

        if(!yamlObj)
            yamlObj = {}
        
        // add object to section
        if(!yamlObj[section])
            yamlObj[section] = {load:"*",configuration:{}}

        if(!yamlObj[section].configuration)
            yamlObj[section].configuration = {}

        if(!yamlObj[section].configuration[id])
            yamlObj[section].configuration[id] = obj;
        else
        {
            // no change..
            return false;            
        }

        return await yamlEditor.save(
            yamlObj,
            this.configPath,
            (content) => {
                // cleanup empty configs
                return content.replace(/(configuration): null/g,"$1:\n");
            });
    }

    /**
     * add a service to a component config.
     * 
     * @param {*} id 
     * @param {*} obj 
     * @param {*} section 
     * @param {*} params 
     * @param {*} type 
     * @param {*} compName 
     * @returns 
     */
    async addToComponent(id, obj,section,params,type="component",compName=null)
    {
        // this.configPath = params.toDir+'/client_data/default/config_default.yml';
        let appId = params.appId;
        let configPath = this.getComponentPath(appId,type,compName);
        if(!compName)
            compName = appId;

        console.log("Registers "+params.type+" in config: "+ configPath);

        const yamlObj = await yamlEditor.load(configPath,true);        
        
        // add object to section
        if(!yamlObj[section])
            yamlObj[section] = {}

        if(!yamlObj[section][id])
            yamlObj[section][id] = obj;
        else
        {
            // no change..
            return false;            
        }

        return await yamlEditor.save(
            yamlObj,
            configPath,
            (content) => {
                // cleanup empty configs
                return content.replace(/(services|tests|routes|tests): null/g,"$1:");
            });
    }

    /**
     * get application path
     * 
     * @param {*} appId 
     * @returns 
     */
    getAppPath(appId) {
        let path = '/applications/'+appId;
        
        path = process.cwd()+'/'+path;
        path = path.replace("//","/");

        return path;
    }

    /**
     * get component path
     * @param {*} appId 
     * @param {*} type 
     * @param {*} compName 
     * @returns {string}
     */
    getComponentPath(appId,type="component",compName=null) 
    {
        if(!compName)
            compName = appId;

        return this.getConfigFilePath(appId,type,compName,"yml","config");
    }

    /**
     * get file path in config or other section 
     *  path form: /application/<appId>/<section>/<name>.<type>.<ext>
     * 
     * @param {string} appId application id
     * @param {string} type type of file that is added to name (ex. c1.<type>.yml)
     * @param {string} name file base name 
     * @param {*} ext 
     * @param {*} section 
     * @returns 
     */
    getConfigFilePath(appId,type="component",name=null,ext="yml",section="config") 
    {
        let path = this.getAppPath(appId);
        if(!name)
            name = appId;

        if(path.search('application')==-1)
            path = '/applications/'+path;

        if(path.search('/'+section)==-1 || appId == "config")
            path = path+'/'+section;

        let fullPath = path+'/'+name+'.'+type+'.'+ext;
        fullPath = fullPath.replace("//","/");

        return fullPath;
    }

    async existsConfigPath(appId,type="component",name=null,ext="yml",section="config") {
        let fullPath = this.getConfigFilePath(appId,type,name,ext,section)
        
        const exists = await fs.existsFileAsync(fullPath);
        return exists;
    }


    /**
     * create a component of type component or module
     * 
     * @param {*} compName 
     * @param {*} appId 
     * @param {*} type 
     * @param {*} forceCreate 
     * @param {*} template 
     * @returns 
     */
    async createComponent(compName,appId,type="component",forceCreate=false,template=null) 
    {
        // function for replacing parts of the template
        const replaceCB = (s,compName,fullPath,appId) => 
        {
            return s.replace(/MY_COMPONENT/g,compName);
        }
        
        return this.createFileFromTemplate(
            compName,
            appId,
            type,
            forceCreate,
            template,
            "config",
            "yml",
            replaceCB);
    } 

    /**
     * create a component of type component or module
     * 
     * @param {*} compName 
     * @param {*} appId 
     * @param {*} type 
     * @param {*} forceCreate 
     * @param {*} template 
     * @returns 
     */
    async createFileFromTemplate(
        compName,
        appId,
        type="component",
        forceCreate=false,
        template=null,
        section="config",
        ext="yml",
        replaceCB=(s,compName,basename) => {s.replace(/MY_COMPONENT/g,compName)}) 
    {
        if(!template)
            template = require("./templates/"+type+".tpl");

        var s = template;

        if(!compName)
            compName = appId;

        let fullPath =  this.getConfigFilePath(appId,type,compName,ext,section);

        // replace path name
        s = replaceCB(s,compName,fullPath,appId);
        
        if(await fs.existsFileAsync(fullPath) && !forceCreate) 
        {
            console.error("this "+type+" already exists");
            return false;
        }

        try 
        {
            await fs.writeFileAsync(fullPath,s,true);    
            console.log(type+" created : "+fullPath);
            return true;
        } 
        catch (error) {
            console.error(error);
            return false;
        }
    }     
    
    async existsComponent(appId,type="component",compName=null) 
    {
        return this.existsConfigPath(appId,type,compName,"yml","config");
    }
}

module.exports = BaseGenerator;
module.exports.BaseGenerator = BaseGenerator;
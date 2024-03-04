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
            if(await this.existsComponent(appId,"module",appId))
            {
                return await this.addToComponent(name, obj,section,params,"module",appId);
            }
    
            if(await this.existsComponent(appId,"component",appId))
            {
                return await this.addToComponent(name, obj,section,params,"component",appId);
            }
    
            if(await this.existsComponent(appId,"component",name))
            {
                return await this.addToComponent(name, obj,section,params,"component",name);
            }
    
            if(false &&  await this.createComponent(appId,appId,"module"))
            {
                return await this.addToComponent(name, obj,section,params,"module",appId);
            }
        }

        this.configPath = params.toDir+'/client_data/default/config_default.yml';

        const yamlObj = await yamlEditor.load(this.configPath,true);
        
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
        let configPath = this.getComponentPath(appId,type);
        if(!compName)
            compName = appId;

        console.log("Registers "+type+" in config: "+ configPath);

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
     * replace comments by COMMENT__<index comment>
     * @param {*} yamlString 
     * @returns 
     */
    replaceComments(yamlString) 
    {
        let index = 1;
        return yamlString.replace(/#[^\n]*/g, (match) => {
            let commentText = match.substring(1).trim();
            commentText = commentText.replace(/"/g,'\\"');
            const comment = `COMMENT__${index++}: "${commentText}"`;
            return comment;
        });
    }

    /**
     * Function to restore comments from "_comment_(index)" lines in a YAML string
     * 
     * @param {*} yamlString 
     * @returns 
     */
    restoreComments(yamlString) 
    {
        // step 1: restore comments enclosed in " "        
        const commentRegex = /COMMENT__(\d+):[\s]+["'](.*)(["'][ ]*)$/gm;
        let yamlString2 = yamlString;
        let match;
        while ((match = commentRegex.exec(yamlString)) !== null) {
            const line = match[0];
            const comment = match[2];
            const restoredComment = `# ${comment}`;
            yamlString2 = yamlString2.replace(line, restoredComment,"");
        }

        // return this.restoreComments2(yamlString2);

        // step 2: restore other comments not enclosed in " "
        const commentRegex2 = /COMMENT__(\d+):\s*(.*)$/gm;
        let yamlString3 = yamlString2;
        while ((match = commentRegex2.exec(yamlString2)) !== null) {
            const index = match[1];
            const comment = match[2];
            const placeholder = `COMMENT__${index}: ${comment}`;
            const re2 = new RegExp(placeholder, '');
            const restoredComment = `# ${comment}`;
            yamlString3 = yamlString3.replace(placeholder, restoredComment);
        }
        return yamlString3;
    }

    // comments without "xx"
    /*
    restoreComments2(yamlString) {
        const commentRegex = /COMMENT__(\d+):\s*(.*)$/gm;
        let restoredYamlString = yamlString;
        let match;
        while ((match = commentRegex.exec(yamlString)) !== null) {
            const index = match[1];
            const comment = match[2];
            const placeholder = `COMMENT__${index}: ${comment}`;
            const re2 = new RegExp(placeholder, '');
            const restoredComment = `# ${comment}`;
            restoredYamlString = restoredYamlString.replace(placeholder, restoredComment);
        }
        return restoredYamlString;
    } 
    */   

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

        if(path.search('/'+section)==-1)
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
        return this.existsConfigPath(appId,"component",compName,"yml","config");
    }
}

module.exports = BaseGenerator;
module.exports.BaseGenerator = BaseGenerator;
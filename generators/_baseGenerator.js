const { app } = require('@nxn/boot/boot.service');
const fs = require('@nxn/files');
const yaml = require('js-yaml');

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

        this.configPath = params.toDir+'/client_data/default/config_default.yml';

        const content = await fs.readFileAsync(this.configPath);
        let content2;

        // preserve comments as YAML entries
        if(content) 
        {
            content2 = this.replaceComments(content.toString());
        }
        
        // Parse YAML
        const yamlObj = yaml.load(content2);
        
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

        // Convert the YAML object back to YAML string
        let content3 = yaml.dump(yamlObj,{quotingType:'"'});        

        let content4 = this.restoreComments(content3);

        // write config back
        try {
            fs.writeFileAsync(this.configPath,content4,true);    
        } catch (error) {
            console.error(error);
        } 

        return content4;
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

        const content = await fs.readFileAsync(configPath);
        let content2;

        // preserve comments as YAML entries
        if(content) 
        {
            content2 = this.replaceComments(content.toString());
        }
        
        // Parse YAML
        const yamlObj = yaml.load(content2);
        
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

        for(let sect2 in yamlObj)
        {
            continue;

            if(sect2 == "services" || sect2 == "routes" ||sect2 == "tests")
                if(yamlObj[sect2]===null)
                    yamlObj[sect2] = {}
        }

        // Convert the YAML object back to YAML string
        let content3 = yaml.dump(yamlObj,{quotingType:'"'});        

        let content4 = this.restoreComments(content3);

        content4 = content4.replace(/(services|tests|routes|tests): null/g,"$1:");

        // write config back
        try {
            await fs.writeFileAsync(configPath,content4,true);    
        } catch (error) {
            console.error(error);
        } 

        return content4;
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
        const commentRegex = /COMMENT__(\d+):[\s]+["']?(.*)(["']?[ ]*)$/gm;
        let restoredYamlString = yamlString;
        let match;
        while ((match = commentRegex.exec(yamlString)) !== null) {
            const line = match[0];
            const comment = match[2];
            const restoredComment = `# ${comment}`;
            restoredYamlString = restoredYamlString.replace(line, restoredComment,"");
        }
        return restoredYamlString;
    }

    restoreComments2(yamlString) {
        const commentRegex = /COMMENT__(\d+):\s*["']?(.*?)["']?\s*$/gm;
        let restoredYamlString = yamlString;
        let match;
        while ((match = commentRegex.exec(yamlString)) !== null) {
            const index = match[1];
            const comment = match[2];
            const placeholder = `COMMENT__${index}: ["']?${comment}["']?`;
            const re2 = new RegExp(placeholder, 'g');
            const restoredComment = `# ${comment}`;
            restoredYamlString = restoredYamlString.replace(re2, restoredComment);
        }
        return restoredYamlString;
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
        let path = this.getAppPath(appId);
        if(!compName)
            compName = appId;

        if(path.search('application')==-1)
            path = '/applications/'+path;

        if(path.search('/config')==-1)
            path = path+'/config';

        let fullPath = path+'/'+compName+'.'+type+'.yml';
        fullPath = fullPath.replace("//","/");

        return fullPath;
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
        if(!template)
            template = require("./templates/component.tpl");

        var s = template;

        // replace path name
        s = s.replace(/MY_COMPONENT/g,compName);

        let fullPath = this.getComponentPath(appId,type,compName);
        
        if(await fs.existsFileAsync(fullPath) && !forceCreate) 
        {
            console.error("this component already exists");
            return false;
        }

        try 
        {
            await fs.writeFileAsync(fullPath,s,true);    
            console.log("component created : "+fullPath);
            return true;
        } 
        catch (error) {
            console.error(error);
            return false;
        }
    } 
    
    async existsComponent(appId,type="component",compName=null) {
        let fullPath = this.getComponentPath(appId,type,compName);
        
        const exists = await fs.existsFileAsync(fullPath);
        return exists;
    }
}

module.exports = BaseGenerator;
module.exports.BaseGenerator = BaseGenerator;
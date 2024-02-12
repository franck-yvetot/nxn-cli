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

    async addToConfig(id, obj,section,params) 
    {
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

    // Function to restore comments from "_comment_(index)" lines in a YAML string
    restoreComments(yamlString) 
    {
        const commentRegex = /COMMENT__(\d+):[\s]+["']?(.*)["']?/g;
        let restoredYamlString = yamlString;
        let match;
        while ((match = commentRegex.exec(yamlString)) !== null) {
            const index = match[1];
            const comment = match[2];
            const placeholder = `COMMENT__${index}:[ ]+["']?(.*)["']?`;
            const re2 = new RegExp(placeholder);
            const restoredComment = `# ${comment}`;
            restoredYamlString = restoredYamlString.replace(re2, restoredComment,"g");
        }
        return restoredYamlString;
    }
}

module.exports = BaseGenerator;
module.exports.BaseGenerator = BaseGenerator;
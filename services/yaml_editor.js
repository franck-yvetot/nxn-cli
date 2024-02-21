const yaml = require('js-yaml');
const fs = require('@nxn/files');

/**
 * YamlEditor loads/save yaml files.
 * 
 * before loading it mapps yaml comments to object entries COMMENT__<index>, so that they
 * are kept in yaml (otherwise comments are simply removed).
 * 
 * before saving, it revert COMMENT__ entries to actuel comments, resulting in modified 
 * version of a yaml that still has its comments...
 * 
 */
class YamlEditor
{
    async load(path,replaceComments=true) 
    {
        const content = await fs.readFileAsync(path);

        return await this.loadString(content,replaceComments);
    }

    async loadString(content,replaceComments=true) 
    {
        let content2;

        // preserve comments as YAML entries
        if(replaceComments)
        {
            if(content) 
            {
                content2 = this.replaceComments(content.toString());
                content2 = this.replaceEmptyLines(content2);
            }    
        }
        else
            content2 = content;
        
        // Parse YAML
        const yamlObj = yaml.load(content2);

        return yamlObj;
    }

    /**
     * save yaml object back to disk.
     * 
     * replaces comments entries (COMMENT__xx: comment) by actual comments (# comment)
     * before saving.
     * 
     * A callback onSave is provided to cleanup content if needed, before saving.
     * 
     * @param {*} obj 
     * @param {*} path 
     * @param {*} onSave 
     * @returns 
     */
    async save(yamlObj,path,onSave=null) 
    {
        // get yaml obj as string w/ comments restored
        let content = this.saveString(yamlObj,onSave);

        // write config back
        try 
        {
            await fs.writeFileAsync(path,content,true);    
            return content;
        } 
        catch (error) {
            console.error(error);
            throw error;
        }
    }

    /**
     * save yaml object back to a string that is returnes.
     * 
     * replaces comments entries (COMMENT__xx: comment) by actual comments (# comment)
     * before saving.
     * 
     * A callback onSave is provided to cleanup content if needed, before saving.
     * 
     * @param {*} obj 
     * @param {*} path 
     * @param {*} onSave 
     * @returns 
     */
    saveString(yamlObj,onSave=null) 
    {
        // Convert the YAML object back to YAML string
        let content = yaml.dump(yamlObj,{quotingType:'"'});        

        let content2 = this.restoreComments(content);
        content2 = this.restoreEmptyLines(content2);

        if(onSave)
            content2 = onSave(content2);

        // return config back
        try 
        {
            return content2;
        } 
        catch (error) {
            console.error(error);
            throw error;
        }
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
     * replace empty lines by LINE__<index line>
     * @param {*} yamlString 
     * @returns 
     */
    replaceEmptyLines(yamlString)
    {
        return yamlString;

        let index = 1;
        return yamlString.replace(/^[\s\t]*$/gm, (match) => {
            const line = `LINE__${index++}: empty`;
            return line;
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

    /**
     * Function to restore comments from "_comment_(index)" lines in a YAML string
     * 
     * @param {*} yamlString 
     * @returns 
     */
    restoreEmptyLines(yamlString) 
    {
        return yamlString;

        let match;
        // step 2: restore lines
        const commentRegex2 = /LINE__(\d+):(\s*empty\s*)$/gm;
        let yamlString2 = yamlString;
        while ((match = commentRegex2.exec(yamlString)) !== null) {
            const index = match[1];
            const comment = match[2];
            const placeholder = `LINE__${index}:${comment}`;
            yamlString2 = yamlString3.replace(placeholder, "\n");
        }
        return yamlString2;
    }    

}

module.exports = new YamlEditor(); 
const file = require('@nxn/files');
const arrAsync = require("@nxn/ext/array.service");

const templates = [
    'client',
    'service',
    'factory',
    'node',
    'route',
    'test',
    'component',
    'module',
    'script',
    'schema',
    'lang',
    'model',
    'crud',
    'db',
    'type',
    'mermaid',
    'middleware',
]

class Generators {

    // async generate(type,path,name,force=false) {
    async generate(type,params) 
    {
        const gen = __dirname+'/'+type+'.js';

        if(!await file.existsFileAsync(gen))
            throw new Error("template does not exist for type "+type);
        
        try 
        {
            const template = require(gen);

            console.log("generator "+template.name());
            await template.generate(params);
        } 
        catch (error) 
        {
            console.error(error.message,error.stack);
        }
    }

    async usage(prefix='node generate.js ') {
        let lines = [];

        await arrAsync.forEachAsync(templates,
            async (type) => {
            const scePath = __dirname+'/'+type+'.js';

            if(!await file.existsFileAsync(scePath))
                return;              

            lines.push('');
                
            const template = require(scePath);
            if(template.usage) {
                const {usage,description} = await template.usage('   ');
                
                lines.push(prefix+type+' '+usage);
                if(description)
                    lines.push(description);
            }
            else
                lines.push(prefix+type);
            
        });

        lines.push('');
        return lines;
    }
}

module.exports = new Generators();
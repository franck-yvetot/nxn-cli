const file = require('@nxn/files');
const arrAsync = require("@nxn/ext/array.service");

const templates = [
    'client',
    'service',
    'route',
    'script'
]

class Generators {

    async generate(type,path,name,force=false) {
        const gen = __dirname+'/templates/'+type+'.js';

        if(!await file.existsFileAsync(gen))
            throw new Error("template does not exist for type "+type);
        
        const template = require(gen);
        await template.generate(path,name,force);
    }

    async usage(prefix='node generate.js ') {
        let lines = [];

        await arrAsync.forEachAsync(templates,
            async (type) => {
            const scePath = __dirname+'/templates/'+type+'.js';

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
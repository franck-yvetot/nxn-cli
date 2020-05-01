const file = require('@nxn/files');

class Generators {

    async generate(type,path,name,force=false) {
        const gen = __dirname+'/templates/'+type+'.js';

        if(!await file.existsFileAsync(gen))
            throw new Error("template does not exist for type "+type);
        
        const template = require(gen);
        await template.generate(path,name,force);
    }
}

module.exports = new Generators();
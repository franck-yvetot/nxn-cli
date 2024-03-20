const fs = require('@nxn/files');

class CltGenerator
{
    init(config) {
    }

    name() {
        return "init";
    }

    usage(pad) {
        return {
            usage:"CLT_NAME",
            description:
pad+`Create empty project.`

        };
    }

    async generate(params) 
    {
        const {name,force,args,path} = params;
        try 
        {
            fs.copyDirSync(
                params.srcDir+"/generators/templates/default/", 
                params.toDir,
                params.force);
            console.log("Generated empty project in "+params.toDir);

            await fs.createDirAsync(params.toDir+"/applications");
            console.log("Added "+params.toDir+"/applications");
        } 
        catch (error) 
        {
            console.error(error);
        }

        return true;
    }
}

module.exports = new CltGenerator();

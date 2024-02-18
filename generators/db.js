const fs = require('@nxn/files');

const BaseGenerator = require("./_baseGenerator")
const strings = require('@nxn/ext/string.service');
const yaml = require('js-yaml');

class ComponentGenerator extends BaseGenerator
{
    init(config) {
    }

    usage(pad=' ') 
    {
        return {
                usage:"db|mysql|firestore|mydb|etc. secretId",
                description:
    pad+`adds a db connector in configuration.
    ${pad}if the db name includes mysql or sql, uses mysql connector, or if firexx, use firestore connector.
    ${pad}if secretId is provided, adds it to configuration for getting credentials.
    `
            };
    }
    
    name() {
        return "db";
    }

    /**
     * load schema file if exists
     * 
     * @param {*} appId 
     * @param {*} name 
     * @param {*} type 
     * @param {*} ext 
     * @param {*} section 
     * @returns 
     */
    async getSchema(appId,name,type="schema",ext="yml",section="models") 
    {
        try 
        {
            if(!this.existsConfigPath(appId,type,name,ext,section))
              return null;

            let fullPath =  this.getConfigFilePath(appId,type,name,ext,section);

            const content = await fs.readFileAsync(fullPath);
            
            // Parse YAML
            const yamlObj = yaml.load(content.toString());        

            return yamlObj;
        } 
        catch (error) 
        {
            console.error("cant load yml schema file, please create it first",error);
            return null
        }
    }

    isLangId(lang) {
        const europeanLanguages = ["en", "fr", "de", "es", "it", "pt", "nl", "sv", "fi", "da", "no", "pl", "cs", "hu", "ro", "bg", "el", "et", "hr", "lt", "lv", "mt", "sk", "sl"];
        
        if (europeanLanguages.includes(lang)) {
            return lang;
        }
    
        return null;
    }
    
    isDBId(arg) 
    {
        
        if (arg.search(/sql/i) != -1) 
        {
            return {type:"mysql",id:arg};
        }
    
        if (arg.search(/fire/i) != -1) 
        {
            return {type:"firestore",id:arg};
        }

        if (arg.search(/mongo/i) != -1) 
        {
            return {type:"mongodb",id:arg};
        }

        return null;
    }

    getExtraParams(params) 
    {
        if(params.args.length <= 2)
            return;

        let db;

        for(let i= 2;i<params.args.length;i++) 
        {
            let arg = params.args[i];

            if(arg == "force")
                params.force = arg;

            else if(this.isLangId(arg))
                params.lang = this.isLangId(arg);

            else if(db = this.isDBId(arg))
            {
                params.db = arg;
                params.db_type = db.type;
            }
        }

        return params;
    }

    /**
     * generate lang file
     * 
     * @param {*} fields 
     * @param {*} lang = en
     * @returns 
     */
    async generate(params,optional=false) 
    {
        let {name, appId,force,path} = params;
        params = this.getExtraParams(params);

        let forceCreate = (params.force == 'force');   

        if(!params.db)
        {
            if(!optional)
                console.error("no db provided");
            
            return false;
        }

        // now update main configuration
        let desc;
        if(params.db_type == "mysql")
        {
            desc = 
            {
                path: "@nxn/db/mysql.service",
                conPath: ".mysql",
                log: true
            }
        }
        //else if(params.db_type == "firestore")
        {
            desc = 
            {
                upath: "firestore@googleapi",
                conPath: ".firestore"
            }
        }

        await this.addToConfig(params.db, desc,"services",params);        
    }
}

module.exports = new ComponentGenerator();

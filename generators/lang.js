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
                usage:"<Schema name>@<APPLICATION>",
                description:
    pad+`adds a locale for a schema, to be used by @nxn/db model.
    ${pad}The application folder is created if it doesn't exist yet.
    `
            };
    }
    
    name() {
        return "lang";
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
    

    getExtraParams(params) 
    {
        if(params.args.length <= 2)
            return;

        for(let i= 2;i<params.args.length;i++) 
        {
            let arg = params.args[i];

            if(arg == "force")
                params.force = arg;

            else if(this.isLangId(arg))
                params.lang = this.isLangId(arg);

            else 
                params.db = arg;
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
    async generate(params,fields=null) 
    {
        let {name, appId,force,path} = params;
        params = this.getExtraParams(params);

        const lang = params.lang || "en";
        let forceCreate = (params.force == 'force');

        if(!fields)
        {
            let schema = await this.getSchema(appId,name);
            fields = schema.fields;            
        }

        let template = ` 
lang: LANG

# generic strings
strings:
  infos: Infos

# field labels
fields:
FIELDS

# add here your enum translated values
enums:
  role:
    redacteur: Creator
    validateur: Validator
    verificateur: Checker        
`;
        let fieldLabels = [];

        for (let fname in fields)
        {
            const field = fields[fname];
            const CamelName = strings.toCamelCase(fname,true);            
            let label = field.title || CamelName;
            fieldLabels.push("  "+fname+": "+label);
        }

        let FIELDS = fieldLabels.join("\n");

        // function for replacing parts of the template
        const replaceCB = (s,name,fullPath,appId) => 
        {
            return s
                .replace(/LANG/g,lang)
                .replace(/FIELDS/g,FIELDS)
                ;
        }        

        this.createFileFromTemplate(
            lang+"_"+name,
            appId,
            "strings",
            forceCreate,
            template,
            "locales",
            "yml",
            replaceCB);        

        // now update main configuration
        let locale = 
        {
            upath: "locale@nxn/db",
            default: "en",    
            langs:{
                en: "$ref(../locales/"+lang+"_"+name+".strings)"
            }
        }   

        await this.addToConfig(name+"_locale", locale,"services",params);        
    }
}

module.exports = new ComponentGenerator();

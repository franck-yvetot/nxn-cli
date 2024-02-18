const fs = require('@nxn/files');

const BaseGenerator = require("./_baseGenerator")
const strings = require('@nxn/ext/string.service');
const yaml = require('js-yaml');

const locale = require("./lang");
const dbGen = require("./db");

class ComponentGenerator extends BaseGenerator
{
    init(config) {
    }

    usage(pad=' ') 
    {
        return {
                usage:"myschema@myapp",
                description:
    pad+`adds a database schema, to be used by @nxn/db model.
    ${pad}The application folder is created if it doesn't exist yet.
    `
            };
    }
    
    name() {
        return "schema";
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

    getExtraParams(params) 
    {
        if(params.args.length <= 2)
            return;

        for(let i= 2;i<params.args.length;i++) 
        {
            let arg = params.args[i];

            if(arg == "force")
                params.force = arg;

            else if(locale.isLangId(arg))
                params.lang = locale.isLangId(arg);

            else 
                params.db = arg;
        }

        return params;
    }

    /**
     * generate model:
     * - get schema from yml config
     * - parse fields
     * - generate model for managing data from schema
     * - generate locale lang for fields
     * - update config with locale and model
     * - manage db injection by adding it automatically in config if not created yet
     * 
     * NB. if a db name is provided as last parameter of the command, use it, 
     * or use default "db" param.
     * 
     * @param {*} params 
     */
    async generate(params) 
    {
        let {name, appId,force,path} = params;
        params = this.getExtraParams(params);

        let db = params.db || "db";

        const template = require("./templates/model.tpl");        

        let aName = name.split('/');
        let basename = aName.pop();
        // let appId = params.args[1];

        let forceCreate = (force == 'force');

        let clsName = strings.toCamelCase(basename,true);
        let objName = strings.toCamelCase(basename,false);

        let schema = await this.getSchema(appId,name);
        let fields = schema.fields;
        let fieldDecl = [];
        let fgetters = [];

        await locale.generate(params,fields,params.lang||"en");
        await dbGen.generate(params);       

        let decl = `
    /**
     * @type {FTYPE} FDESCRIPTION.
     */
    FNAME;`;

        let getter = `
    /**
     * Set FNAME
     * @param {FTYPE} FNAME - FDESCRIPTION
     */
    setUP_CAMEL_NAME(FNAME) {
        this.FNAME = FNAME;
    }

    /**
     * Get the FNAME.
     * @returns {FTYPE} - FDESCRIPTION or null if not set.
     */
    getUP_CAMEL_NAME() {
        return this.FNAME || null;
    }
`;

        for (let fname in fields)
        {
            const field = fields[fname];

            let ftype = "string";
            if(field.type == "integer" || field.type == "float" || field.type == "number")
                ftype = "number";

            const CamelName = strings.toCamelCase(fname,true);

            let desc = {
                fname,
                ftype,
                description: field.description || field.title || field.label || fname,
                CamelName
            }

            let decl2 = decl
                .replace("FNAME",desc.fname)
                .replace("FTYPE",desc.ftype)
                .replace("FDESCRIPTION",desc.description);

            fieldDecl.push(decl2);

            let getter2 = getter
                .replace(/UP_CAMEL_NAME/g,desc.CamelName)
                .replace(/FNAME/g,desc.fname)
                .replace(/FTYPE/g,desc.ftype)
                .replace(/FDESCRIPTION/g,desc.description)
                ;

            fgetters.push(getter2);
        }

        let decls = fieldDecl.join("\n");
        let getters = fgetters.join("");

        // function for replacing parts of the template
        const replaceCB = (s,name,fullPath,appId) => 
        {
            return s
                .replace(/CLASS_NAME/g,clsName)
                .replace(/OBJ_NAME/g,objName)            
                .replace(/FIELDS/,decls)
                .replace(/GETTERS_SETTERS/,getters)
                ;
        }
        
        this.createFileFromTemplate(
            name,
            appId,
            "model",
            forceCreate,
            template,
            "models",
            "js",
            replaceCB);

        // now update main configuration with new model
        let model = 
        {
            path: "@nxn/db/db_model.service",
            schema: "$ref(../models/"+name+".schema)",    
            injections: 
            {
                db: db,
                locale: name+"_locale"
            }
        }

        await this.addToConfig(name+"_model", model,"services",params);                  

            /*
            test1_model:
            path: "@nxn/db/db_model.service"
            schema: $ref(../models/test1.schema)
            injections:
                db: db
                locale: test1_locale  
            */          
    }
}

module.exports = new ComponentGenerator();

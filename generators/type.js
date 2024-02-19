const fs = require('@nxn/files');
const _path_ = require('path');
const strings = require('@nxn/ext/string.service');
const BaseGenerator = require("./_baseGenerator")

const template = `declare module 'MY_MODULE'
{
    /* 
    add here your types in typescript format.
    NB. do not add anything before or after the declare module line and block

    EXAMPLE:
    export interface IMyType {
        a : number
    } 

    USAGE : 
    after declaring your types, youi can use them in javascript files.
    example: in jsdoc :

    @typedef {import('gfiles').gOrderBy} gOrderBy
    */
}`;

class Generator extends BaseGenerator
{
    name() {
        return "type";
    }

    usage(pad=' ') {
        return {
            usage:"<NAME>@<APPLICATION>",
            description:
pad+`adds a type module in an application, code is generated in /applications/APPLICATION/types/NAME.d.ts,
${pad}where APPLICATION and NAME are the names of the application and type module.
`
        };
    }

    async generate(params) 
    {
        let {name,appId,force,path} = params;

        let aName = name.split('/');
        let basename = aName.pop();

        let path2 = aName.join('/');
        path = path+'/'+path2;
        
        basename = _path_.basename(basename);
        let matches = basename.match('/([^.]+)[.]type/');
        if(matches)
            basename=matches[1];
        
        if(path.search('/types')==-1 && path.search('node_modules')==-1)
            path = path+'/types';

        let fullPath = path+'/'+basename+'.d.ts';
        fullPath = fullPath.replace("//","/");

        let s = template;
        let Basename = strings.toCamelCase(basename,true);

        // replace path name
        s = s.replace(/MY_MODULE/g,basename);

        if(await fs.existsFileAsync(fullPath) && (force!='force')) 
        {
            console.error("this types file already exists");
        }
        else {
            try {
                fs.writeFileAsync(fullPath,s,true);    
            } catch (error) {
                console.error(error);
            }    
        }

        console.log("Generated type module "+fullPath);
        return true;
    }
}

module.exports = new Generator();

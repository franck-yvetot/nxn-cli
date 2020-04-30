const fs = require('nxn/file.service');

const template = `const router = require("express").Router();
const debug = require("nxn-boot/debug.service")('MY_ROUTE');

router.get('/', async (req, res)=> {

    try {

        let res = {code:"OK",data:[]};
        res.send();    
    }
    catch(error) {
        let message = error.message || error.error;
        let code = parseInt(error.code||500, 10) || 500;
        res.status(code).send({code,error:message});
        debug.error(error.stack||error);
    }    
});

module.exports = router;
`;


async function generate(path,name,force) {

    var s = template;
    s = s.replace(/MY_ROUTE/g,name);

    if(path.search('application')==-1)
        path = '/applications/'+path;

    if(path.search('/routes')==-1)
        path = path+'/routes';

    let fullPath = path+'/routes/'+name+'.route.js';
    fullPath = fullPath.replace("//","/");
    
    if(await fs.existsFileAsync(fullPath) && (force!='force')) {
        console.error("this route already exists");
        return false;
    }

    try {
        fs.writeFileAsync(fullPath,s,true);    
    } catch (error) {
        console.error(error);
    }

    console.log("Generated route "+fullPath);
    return true;
}

module.exports = {generate};

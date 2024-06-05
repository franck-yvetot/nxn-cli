
// module alias : allow access to applications services from config files
// install : npm i --save module-alias
const {configSce,bootSce} = require("@nxn/boot");

// init config reader from client data
var myArgs = process.argv.slice(2);

// support --experimental-modules or other option
if(myArgs[0].startsWith("--"))
    myArgs.shift();

// support .mjs with import() 
if(myArgs[0].startsWith("--"))
    myArgs.shift();

let client = myArgs[0] || 'default';
global.__clientDir = `${__dirname}/client_data/${client}/`;

// directory where to store temporary files used for a client app
// should not be gittable
global.__dataDir = __clientDir+"/.data/";

// get variables to be injected into the config as ${my_variable}
// variables are dependent from the environment
const env = myArgs[2] || process.env.NODE_ENV;
const configPath = [__clientDir+'/env/'+env,__clientDir,__dirname];


// read main config defining the modules (middleware, services, nodes, run, test)
let configName = myArgs[1] || 'default';
if(configName.search(/[.](json|ya?ml)/)==-1)
    configName = 'config_'+configName;

bootSce.run(configName,configPath);
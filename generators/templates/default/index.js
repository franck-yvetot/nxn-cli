console.log("STARTING SERVER FROM "+__dirname);

/** ======================================================================
 * 
 *  index.js : 
 *  this program is written in node.js and is using @nxn open source
 *  framework. @nxn is similar to angular but for node.js.
 * 
 *  It is based on "services" (ex. mongodb, firestore, gcs, etc) 
 *  and "nodes (components executing an atomic task:  
 *  - receives a message
 *  - executes a task (ex. reading a spreadsheet row, or parsing a file),
 *  - calling next node in the chain.
 * 
 *  A program is actually a "configuration" with services and nodes used, 
 *  and their params. This concept is similar to low code programming.
 *  (actually a UI will come later, to use it as a low code plateform
 *  if needed). A node perforing a task dont need to know where the data comes
 *  from, nor where the results are sent. It only knows about messages and
 *  nodes injections. This allow to reuse a program for various environements,
 *   flexibility and massive reuse of code.
 *  
 * 
 *  @nxn ecosystem keywords : 
 *  injections, YAML configuration, google services, low code, workflow engine
 * 
 */

// boot reads a configuration, init middleware and services, and run tasks and nodes
const {bootSce} = require("@nxn/boot");

// ============= INIT MAIN ENVIRONMENT VRAIABLES ==========
var myArgs;
if(process.env.ARGS)
{
    myArgs = process.env.ARGS.split(' ');
}
else
{
    myArgs = process.argv.slice(2);
}

// CLIENT 
let client = myArgs[0] || 'default';
global.__clientDir = `${__dirname}/client_data/${client}/`;

// ENV
const env = myArgs[2] || process.env.NODE_ENV || 'prod';

// CONFIG NAME : conf_<config name>.yml files to "run"
let configName = myArgs[1] || 'config';
if(configName.search(/[.](json|ya?ml)/)==-1)
    configName = 'config_'+configName;

// get config ID
global.__instanceId = configName.replace(/config_/,'');

// LOCAL DATA DIR
global.__dataDir = `${__clientDir}.data/${env}/${__instanceId}`;

// main DIR
global.__mainDir = __dirname;

// CONFIG PATH : env,client, project root
const configPath = [__clientDir+'/env/'+env,__clientDir,__dirname];


// Run config = program(client, env, config)
return bootSce.run(configName,configPath);
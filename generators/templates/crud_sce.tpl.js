const template = `// @ts-check
const debug = require("@nxn/debug")('Crud');
const FlowNode = require("@nxn/boot/node");

const { DbModel, DbModelInstance} = require("@nxn/db/db_model.service");
const MODEL_NAME = require("../models/MODEL_FILE.model");

/**
 * @typedef {{email,lang,client_id?} | null} TUser
 */

/** my service description here */
class GFileSce extends FlowNode
{
    /**
     * DB model
     * @type {DbModel} */
    model;

    constructor(instName) {
        super(instName);
    }

    /** init the service with a config */
    async init(config,ctxt,...injections) {
        super.init(config,ctxt,injections); 

        /** get DB Model */
        this.model = this.getInjection('model');
    }

    isOk() 
    {
        // return this.otherSce && this.otherSce.isOk();
        return super.isOk() && this.model?.isOk();
    }

    /**
     * Create object from data
     * 
     * @param {*} data 
     */
    loadObjectFromData(data) {
        return MODEL_NAME.build(data);
    }

    /**
     * 
     * @param {*} query
     * @param {TUser} [user=null] 
     * @param {*} withMeta 
     * @returns {Promise<MODEL_NAME[]>} 
     */
    async list(query={},user=null,withMeta=true) 
    {
        try 
        {
            let modelInst = await this.model.instance(user?.lang,user?.client_id);

            let records = await modelInst.find(query,{view:"list"});
            if(records.data?.length)
            {
                return records.data.map(rec => MODEL_NAME.build(rec));
            }       

            return [];
        } 
        catch (error) 
        {
            debug.error(error);
            throw error;
        }
    }

    /**
     * create new record
     * 
     * @param {MODEL_NAME} doc
     * @param {TUser} [user=null] 
     * @param {*} withMeta 
     * @returns {Promise<MODEL_NAME>} 
     */
    async insert(doc,user,withMeta=true) 
    {
        try
        {
            let modelInst = await this.model.instance(user?.lang,user?.client_id);

            let data = doc.data();
            let id = await modelInst.insertOne(data);
            if(id)
            {
                doc.setId(id);
            }                
            return doc;
        } 
        catch (error) 
        {
            throw error;
        }
    }

    /**
     * 
     * @param {*} id 
     * @param {TUser} [user=null]
     * @param {*} withMeta 
     * @returns {Promise<MODEL_NAME|null>}
     */
    async get(id,user=null,withMeta=true) 
    {
        try
        {
            let modelInst = await this.model.instance(user?.lang,user?.client_id);

            let record = await modelInst.findById(id,{view:"record"});

            if(!record)
                return null;

            return MODEL_NAME.build(record?.data);
        } 
        catch (error) 
        {
            throw error;
        }
    }

    /**
     * 
     * @param {string} id 
     * @param {MODEL_NAME} doc 
     * @param {TUser} [user=null]
     * @param {boolean} withMeta 
     * @returns 
     */
    async update(id,doc,user = null,withMeta=true) 
    {
        try
        {
            let modelInst = await this.model.instance(user?.lang,user?.client_id);

            let record = await modelInst.updateOne(id,doc,{view:"record"});
            if(record)
            {
                return record;
            }                
        } 
        catch (error) 
        {
            throw error;
        }
    }

    /**
     * delete record
     * @param {string} id 
     * @param {TUser} [user=null]
     */
    async delete(id, user=null) 
    {
        // now delete file rating
        try
        {
            let modelInst = await this.model.instance(user?.lang,user?.client_id);

            await modelInst.deleteOne({id},{view:"record"});
        } 
        catch (error) 
        {
            throw error;
        }
    }
}

module.exports = new GFileSce();

// export types for jsdoc type checks
module.exports.GFileSce = GFileSce;
`;

module.exports = template;
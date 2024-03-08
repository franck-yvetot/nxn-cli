
 const template = `/**
  * Represents a model for CLASS_NAME
  */
 class CLASS_NAME 
 {
FIELDS
    
    /**
     * Create a new CLASS_NAME object.
     * @param {number} id - The unique identifier for the OBJ_NAME.
     */
    constructor(FIELD_ID)
    {
        Object.assign(this,{});
        this.FIELD_ID = FIELD_ID;
    }

    /**
     * Checks if the OBJ_NAME object is valid.
     * @returns {boolean} - True if the OBJ_NAME is valid; otherwise, false.
     */
    isOk() {
        return !!this.getId();
    }
    
    // GETTERS and SETTERS
    GETTERS_SETTERS    

    /**
     * Reset the OBJ_NAME data.
     * @returns {CLASS_NAME} - Returns the OBJ_NAME object for chaining.
     */
    reset() {
        Object.assign(this, {
        });

        return this; // for chaining
    }
  
    /**
     * Load data into the OBJ_NAME object.
     * @param {Object} data - The data to be loaded into the OBJ_NAME object.
     * @returns {CLASS_NAME} - Returns the OBJ_NAME object for chaining.
     */
    loadData(data) {
        Object.assign(this, data);
        return this;
    }

    /**
     * Get a copy of the OBJ_NAME data.
     * @returns {Object} - A copy of the OBJ_NAME data.
     */
    data() {
        return { ...this };
    }
      
    /**
     * Build a CLASS_NAME object from the given data.
     * @param {Object} data - The data to build the CLASS_NAME object from.
     * @returns {CLASS_NAME} - A new CLASS_NAME object.
     */
    static build(data) {
        return new CLASS_NAME(data.id).loadData(data);
    }

    /**
     * Get an empty CLASS_NAME object with the specified uid.
     * @param {number} id - The unique identifier for the CLASS_NAME object.
     * @returns {CLASS_NAME} - An empty CLASS_NAME object.
     */
    static getEmpty(id) {
        return new CLASS_NAME(id).reset();
    }
}
  
module.exports = CLASS_NAME;
  `;

module.exports = template;
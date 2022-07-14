require('dotenv').config()
const { Shopify, ApiVersion } = require('@shopify/shopify-api');
const { v4: uuid_v4 } = require('uuid')
const { PriceRule, DiscountCode } = require('@shopify/shopify-api/dist/rest-resources/2021-10/index.js');



const {
    SHOPIFY_API_KEY,
    SHOPIFY_API_SECRET,
    SHOPIFY_ACCESS_TOKEN,
    SCOPES,
    SHOP,
    HOST_NAME
} = process.env

// Initialize the shopify context
Shopify.Context.initialize({
    API_KEY: SHOPIFY_API_KEY,
    API_SECRET_KEY: SHOPIFY_API_SECRET,
    SCOPES: SCOPES,
    API_VERSION: ApiVersion.October21,
    HOST_NAME: HOST_NAME,
    IS_EMBEDDED_APP: false
})

const restClient = new Shopify.Clients.Rest(
    SHOP,
    SHOPIFY_ACCESS_TOKEN,
);


function returnIdString() {
    const splitStr
        = uuid_v4().split('-').pop()
    return splitStr
}

function createStringsWithPrefix(prefix, number_of_strings) {
    const strList = []
    for (let index = 0; index < number_of_strings; index++) {
        const str = returnIdString()
        const prefixStr = prefix + '-' + str
        if (!strList.includes(prefixStr)) {
            strList.push(prefixStr)
        }
    }
    console.log(`I have ${strList.length} ids`)
    return strList
}

function formatStringsArrayToCodes(stringArray) {
    const formatedCodesArray = stringArray.map(string => {
        return {
            code: string
        }
    })
    return formatedCodesArray
}

function returnSession() {
    return {
        shop: SHOP,
        accessToken: SHOPIFY_ACCESS_TOKEN,
    }
}

// Set up default price rule template
const default_rule_definition = {
    title: "SUMMERSALE10OFF",
    target_type: "line_item",
    target_selection: "all",
    allocation_method: "across",
    value_type: "fixed_amount",
    value: "-10.0",
    customer_selection: "all",
    starts_at: "2022-01-19T17:59:10Z",
}

async function createPriceRule(rules = default_rule_definition) {
    /* Price rule ids
    SUMMERSALE10OFF 1194068345069
    SUMMERSALE10OFF 1194068017389
    CYBORG-CODE 1186289254637 
    */
    // Set up the price rules
    const price_rule = new PriceRule({ session: returnSession() });
    price_rule.title = rules.title;
    price_rule.target_type = rules.target_type;
    price_rule.target_selection = rules.target_selection;
    price_rule.allocation_method = rules.allocation_method;
    price_rule.value_type = rules.value_type;
    price_rule.value = rules.value;
    price_rule.customer_selection = rules.customer_selection;
    price_rule.starts_at = rules.starts_at;
    // Make the request
    const result = await price_rule.save({});
    return result
}


async function createBatchDiscountCodesFromPriceId(price_rule_id, codes_array) {
    /* codes array should have the shape
    [{"code": "SUMMER1"}, {"code": "SUMMER2"}, {"code": "SUMMER3"}]
    The codes array should have a max length of 100 as per shopify limits
    */
    const discount_code = new DiscountCode({ session: returnSession() });
    discount_code.price_rule_id = price_rule_id;
    const result = await discount_code.batch({
        body: { "discount_codes": codes_array },
    });
    return result
}

async function getDiscountCodeJobStatus(price_rule_id, batch_id) {
    const result = await DiscountCode.get_all({
        session: returnSession(),
        price_rule_id: price_rule_id,
        batch_id: batch_id,
    });
    return result
}

async function makeTimeLimitedRequests(time, payload, price_rule) {

    const myRequest = new Promise((resolve, reject) => {
        setTimeout(async () => {
            try {
                // Send in 100 codes at time
                const batch_responds = await createBatchDiscountCodesFromPriceId(price_rule, payload)
                const failures = batch_responds.discount_code_creation?.failed_count
                resolve(`Payload length : ${payload.length} with ${failures} failures`)
            } catch (error) {
                reject(error)
            }
        }, time);
    })
    return myRequest
}


async function bulkConvertCodesArrayToDiscountCodes(original_array, price_rule) {
    // Copy the array
    const copy_of_original_array = original_array.slice()
    while (copy_of_original_array.length) {
        // Initialize response trackers
        let resp1, resp2, respAll
        // Initialize the spliced arrays
        let spliceArr1, spliceArr2
        // Try to splice the variables for the two calls
        spliceArr1 = copy_of_original_array.splice(0, 100)
        spliceArr2 = copy_of_original_array.splice(0, 100)

        if (spliceArr1.length && spliceArr2.length) { // Both arrays have values
            respAll = await Promise.all([makeTimeLimitedRequests(2000, spliceArr1, price_rule), makeTimeLimitedRequests(2000, spliceArr2, price_rule)])
        } else if (spliceArr1.length && !spliceArr2.length) { // The first array has a value
            resp1 = await makeTimeLimitedRequests(2000, spliceArr1, price_rule)
        } else if (!spliceArr1.length && !spliceArr2.length) { // Both arrays don't have values
            console.log("Both splices are empty", spliceArr1, spliceArr2)
        } else { // What condition is this?
            console.log(" Can this occur ???", copy_of_original_array, spliceArr1, spliceArr2)
        }
        console.log("Length of remaining codes", copy_of_original_array.length, " Response from promise 1", resp1, "response from promise 2", resp2, "response all", respAll)
    }
    return 'Job complete!!!'
}

module.exports = {
    returnIdString,
    createStringsWithPrefix,
    formatStringsArrayToCodes,
    createPriceRule,
    createBatchDiscountCodesFromPriceId,
    getDiscountCodeJobStatus,
    makeTimeLimitedRequests,
    bulkConvertCodesArrayToDiscountCodes,
    restClient
}
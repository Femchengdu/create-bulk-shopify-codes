
const {
    createStringsWithPrefix,
    formatStringsArrayToCodes,
    bulkConvertCodesArrayToDiscountCodes,
    createPriceRule,
    createBatchDiscountCodesFromPriceId,
    getDiscountCodeJobStatus,
    makeTimeLimitedRequests,
    restClient,
} = require("./helpers/helperFunctions");



//let response = await makeTimeLimitedRequests(2000, start)
//const response = await restClient.get({ path: '/admin/api/2021-10/price_rules.json' })
//response = await restClient.get({ path: '/admin/api/2021-10/price_rules/1186289254637/batch/400527261933.json' })
//console.log("The registerd price rule", response.body.price_rules)
//const response = await createPriceRule()
// const first100Slice = genratedRawCodes.slice(0, 100)
// const batchDiscountRes = await createBatchDiscountCodesFromPriceId('1186289254637', first100Slice)
//const batchJobStatus = await getDiscountCodeJobStatus('1186289254637', '400527261933')


(async () => {
    // Create a strings array of a given length
    const stringList = createStringsWithPrefix('CYBORG-CODE', 10980)
    // Format the strings list to codes list
    const genratedRawCodes = formatStringsArrayToCodes(stringList)
    // Bulk transform the codes list to discount codes
    let response = await bulkConvertCodesArrayToDiscountCodes(genratedRawCodes, '1186289254637')
    console.log(response)
})()

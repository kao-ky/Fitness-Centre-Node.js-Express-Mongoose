const Transaction = require("../schema/Transaction");

/**
 * The aggregation contains two parts
 * @transactions
 * Fetech transactions documents from db and sort them by email
 * @summary
 * Sum of subtotal, tax, total of all transactions
 * 
 * Afterward, decompose summary and remove summary object
 */
const summaryAggregation = (isDescending) => {
    const sortValue = (isDescending) ? -1 : 1;
    return [
        {
            $facet: {
                transactions: [
                    {
                        $addFields:
                        {
                            date: { 
                                $dateToString: {
                                    date: "$date",
                                    format: "%Y-%m-%d",
                                } 
                            }
                        },
                    },
                    {
                        $sort: {
                            "email": sortValue,
                        },
                    }
                ],

                summary: [
                    {
                        $group: {
                            _id: null,
                            subtotal: {
                                $sum: "$subtotal",
                            },
                            tax: {
                                $sum: "$tax",
                            },
                            total: {
                                $sum: "$total",
                            }
                        },
                    },
                ],
            },
        },
        {
            $addFields: {
                "subtotal": {
                    $arrayElemAt: ["$summary.subtotal", 0]
                },
                "tax": {
                    $arrayElemAt: ["$summary.tax", 0]
                },
                "total": {
                    $arrayElemAt: ["$summary.total", 0]
                }
            },
        },
        {
            $project: {
                "summary": 0
            }
        }
    ];
}

const getTransactionSummary = async (isDescending) => {
    const [result] = await Transaction.aggregate(summaryAggregation(isDescending));
    return result;
}

const createMembershipFee = async (user) => {
    const txn = new Transaction({
        email: user.email,
        subtotal: 75.00,
        total: 75.00,
    });
    return await txn.save();
}

module.exports = {
    getTransactionSummary,
    createMembershipFee,
}
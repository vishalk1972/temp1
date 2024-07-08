const { db } = require('../../db'); 
const userPercentageChange = async (req, res) => {
    try {
        // Calculate dates for previous complete month (June) and month before that (May)
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth() + 1; // Months are zero-indexed, so add 1

        // Calculate end date of previous complete month (June)
        const lastMonthEnd = new Date(currentYear, currentMonth - 1, 0); // Last day of previous month (June)
        const lastMonthStart = new Date(currentYear, currentMonth - 2, 1); // First day of month before last month (May)

        // Query to get count of unique users who asked questions in the last complete month (June)
        const lastMonthUsers = await db.qA.findMany({
            where: {
                createdAt: {
                    gte: lastMonthStart,
                    lte: lastMonthEnd,
                },
            },
            distinct: ['userId'],
        });

        const lastMonthUserCount = lastMonthUsers.length;

        // Query to get count of unique users who asked questions in the month before last (May)
        const monthBeforeUsers = await db.qA.findMany({
            where: {
                createdAt: {
                    gte: new Date(currentYear, currentMonth - 3, 1), // First day of month before last month (May)
                    lte: new Date(currentYear, currentMonth - 2, 0),   // Last day of month before last month (May)
                },
            },
            distinct: ['userId'],
        });

        const monthBeforeUserCount = monthBeforeUsers.length;

        // Calculate percent change
        let percentChange = 0;
        if (monthBeforeUserCount !== 0) {
            percentChange = ((lastMonthUserCount - monthBeforeUserCount) / monthBeforeUserCount) * 100;
        }

        res.json({
            success: true,
            message: 'Percent change in users calculated successfully',
            lastMonthUserCount,
            monthBeforeToLastUserCount:monthBeforeUserCount,
            percentChange,
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message || error,
        });
    }
};

module.exports = userPercentageChange;

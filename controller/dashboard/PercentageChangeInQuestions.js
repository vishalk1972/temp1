const { liveDb } = require('../../config/liveDb');
const { devDb } = require('../../config/devDb');

const getPercentageChange = (oldNumber, newNumber) => {
    if (oldNumber === 0) {
        return newNumber === 0 ? 0 : 100; // Avoid division by zero
    }
    const increaseValue = newNumber - oldNumber;
    return (increaseValue / oldNumber) * 100;
};

const PercentageChangeInQuestions = async (req, res) => {
    try {
        // Get current date
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth();
        const currentYear = currentDate.getFullYear();

        // Calculate date range for the last month (previous month from the current date)
        const lastMonthEndDate = new Date(currentYear, currentMonth, 0); // Last day of the previous month
        const lastMonthStartDate = new Date(lastMonthEndDate.getFullYear(), lastMonthEndDate.getMonth(), 1); // First day of the previous month

        // Calculate date range for the previous month (month before the last month)
        const previousMonthEndDate = new Date(lastMonthStartDate.getFullYear(), lastMonthStartDate.getMonth(), 0); // Last day of the month before the previous month
        const previousMonthStartDate = new Date(previousMonthEndDate.getFullYear(), previousMonthEndDate.getMonth(), 1); // First day of the month before the previous month

        // Count questions for the last month
        const lastMonthQuestionsCount = await liveDb.qA.count({
            where: {
                createdAt: {
                    gte: lastMonthStartDate,
                    lt: new Date(lastMonthEndDate.getFullYear(), lastMonthEndDate.getMonth(), lastMonthEndDate.getDate() + 1), // Add one day to include the last day
                },
            },
        });

        // Count questions for the previous month
        const monthBeforeLastMonthQuestionsCount = await liveDb.qA.count({
            where: {
                createdAt: {
                    gte: previousMonthStartDate,
                    lt: new Date(previousMonthEndDate.getFullYear(), previousMonthEndDate.getMonth(), previousMonthEndDate.getDate() + 1), // Add one day to include the last day
                },
            },
        });

        // Calculate the percentage change
        const percentageChange = getPercentageChange(monthBeforeLastMonthQuestionsCount, lastMonthQuestionsCount);

        return res.status(200).json({
            success: true,
            lastMonthQuestionsCount,
            monthBeforeLastMonthQuestionsCount,
            percentageChange,
        });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message || error,
        });
    } finally {
        liveDb.$disconnect();
        devDb.$disconnect();
      }
}

module.exports = PercentageChangeInQuestions;

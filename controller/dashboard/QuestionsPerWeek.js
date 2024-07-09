const { db } = require('../../db.js');

const getWeekStartAndEndDates = (date) => {
    const dayOfWeek = date.getDay(); // 0 (Sunday) to 6 (Saturday)
    const startDate = new Date(date);
    const endDate = new Date(date);
    
    // Adjust startDate to the previous Monday
    startDate.setDate(date.getDate() - ((dayOfWeek + 6) % 7));
    startDate.setHours(0, 0, 0, 0);
    
    // Adjust endDate to the next Sunday
    endDate.setDate(startDate.getDate() + 6);
    endDate.setHours(23, 59, 59, 999);
    
    return { startDate, endDate };
};

const formatDate = (date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
};

const parseDateInput = (dateStr) => {
    const [month, day, year] = dateStr.split('/').map(Number);
    return { day, month, year };
};

const QuestionsPerWeek = async (req, res) => {
    try {
        const { StartDate, EndDate } = req.body;

        if (!StartDate || !EndDate) {
            return res.status(400).json({
                success: false,
                message: 'Invalid date format',
            });
        }

        const from = parseDateInput(StartDate);
        const to = parseDateInput(EndDate);

        const startDate = new Date(from.year, from.month - 1, from.day);
        const endDate = new Date(to.year, to.month - 1, to.day);

        if (isNaN(startDate) || isNaN(endDate)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid date format',
            });
        }

        if (startDate >= endDate) {
            return res.status(400).json({
                success: false,
                message: '"StartDate" must be less than "EndDate"',
            });
        }

        // Adjust startDate to the Monday of the week it belongs to
        const { startDate: adjustedStartDate } = getWeekStartAndEndDates(startDate);
        // Adjust endDate to the Sunday of the week it belongs to
        const { endDate: adjustedEndDate } = getWeekStartAndEndDates(endDate);

        let currentStart = new Date(adjustedStartDate);
        let result = [];

        while (currentStart <= adjustedEndDate) {
            const { startDate: weekStart, endDate: weekEnd } = getWeekStartAndEndDates(currentStart);

            const questions = await db.qA.count({
                where: {
                    createdAt: {
                        gte: weekStart,
                        lte: weekEnd,
                    },
                },
            });

            result.push({
                WeekStartDate: formatDate(weekStart),
                WeekEndDate: formatDate(weekEnd),
                NumberOfQuestionsAsked: questions
            });

            currentStart.setDate(currentStart.getDate() + 7);
        }

        return res.status(200).json({
            success: true,
            weeklyQuestions: result,
        });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message || error,
        });
    }
}

module.exports = QuestionsPerWeek;

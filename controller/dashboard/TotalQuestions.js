const { liveDb } = require('../../config/liveDb');
const { devDb } = require('../../config/devDb');

const parseDateInput = (dateStr) => {
    const [month, day, year] = dateStr.split('/').map(Number);
    return { day, month, year };
};

const TotalQuestions = async (req, res) => {
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

        // Check if the start date is less than the end date
        if (startDate >= endDate) {
            return res.status(400).json({
                success: false,
                message: '"from" date must be less than "to" date',
            });
        }

        // Query the database for the questions within the date range
        const questions = await liveDb.qA.findMany({
            where: {
                createdAt: {
                    gte: startDate,
                    lte: endDate,
                },
            },
            select: {
                id: true,
            },
        });

        // Extract the IDs from the questions
        const questionIDs = questions.map(question => question.id);

        return res.status(200).json({
            success: true,
            TotalQuestionsCount: questionIDs.length,
            QuestionsList: questionIDs
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

module.exports = TotalQuestions;

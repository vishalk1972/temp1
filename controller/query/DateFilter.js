const { liveDb } = require('../../liveDb');
const { devDb } = require('../../devDb');

const parseDateInput = (dateStr) => {
    const [month, day, year] = dateStr.split('/').map(Number);
    return { day, month, year };
};

const DateFilter = async (req, res) => {
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

        // Query the QA table to get all entries within the specified date range
        const qaEntries = await liveDb.qA.findMany({
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

        // Extract QA IDs from the query result
        const qaIds = qaEntries.map(entry => entry.id);

        // Fetch all questions from QuestionMetadata
        const questionsMetadata = await devDb.questionMetadata.findMany({
            select: {
                id: true,
                question: true,
                relatedQAIds: true,
            },
        });

        // Initialize a hashmap to count occurrences
        const questionCountMap = {};

        // Iterate over each question in QuestionMetadata
        for (const questionMeta of questionsMetadata) {
            const { id, question, relatedQAIds } = questionMeta;


            // Count occurrences of related QA IDs within the date range
            relatedQAIds.forEach(qaId => {
                if (qaIds.includes(qaId)) {
                    // Initialize count for this question
                    if (!questionCountMap[id]) {
                        questionCountMap[id] = { id, question, count: 1 };
                    }
                    else {
                        questionCountMap[id].count++;
                    }
                }
            });
        }

        // Convert hashmap to an array and sort by count in descending order
        const sortedQuestions = Object.values(questionCountMap).sort((a, b) => b.count - a.count);

        res.json({
            success: true,
            message: 'Questions fetched successfully',
            data: sortedQuestions,
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

module.exports = DateFilter;
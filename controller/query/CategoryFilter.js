const { db } = require('../../db.js');

const parseDateInput = (dateStr) => {
    const [month, day, year] = dateStr.split('/').map(Number);
    return { day, month, year };
};

const CategoryFilter = async (req, res) => {
    try {
        const { category, subcategory, StartDate, EndDate } = req.body;
        
        if (!category && !subcategory) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a category or sub-category name',
            });
        }

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
                message: 'The "from" date must be earlier than the "to" date',
            });
        }

        let categoryFilter = {};

        if (subcategory && subcategory !== "") {
            categoryFilter = {
                subcategories: {
                    some: {
                        name: subcategory
                    }
                }
            };

            if (category && category !== "") {
                const categoryExists = await prisma.category.findUnique({
                    where: {
                        name: category
                    },
                    include: {
                        subcategories: {
                            where: {
                                name: subcategory
                            }
                        }
                    }
                });

                if (!categoryExists) {
                    return res.status(404).json({
                        success: false,
                        message: 'Category or sub-category not found',
                    });
                }
            }
        } else if (category && category !== "") {
            categoryFilter = {
                categories: {
                    some: {
                        name: category
                    }
                }
            };
        }

        const qaEntries = await prisma.qA.findMany({
            where: {
                createdAt: {
                    gte: startDate,
                    lte: endDate
                }
            },
            select: {
                id: true
            }
        });

        const qaIdSet = new Set(qaEntries.map(entry => entry.id));

        const questions = await prisma.questionMetadata.findMany({
            where: {
                AND: [
                    categoryFilter,
                    {
                        relatedQAIds: {
                            hasSome: Array.from(qaIdSet)
                        }
                    }
                ]
            },
            select: {
                id: true,
                question: true,
                relatedQAIds: true,
                categories: {
                    select: {
                        name: true
                    }
                }
            }
        });

        const filteredQuestions = questions.map(question => ({
            id: question.id,
            question: question.question,
            Count: question.relatedQAIds.filter(qaId => qaIdSet.has(qaId)).length,
        })).sort((a, b) => b.Count - a.Count);

        res.json({
            success: true,
            message: 'Done',
            data: filteredQuestions,
            questionCount: filteredQuestions.length
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
module.exports=CategoryFilter

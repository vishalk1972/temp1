const { db } = require('../../db.js');
const CategoryFilter = async (req, res) => {
    try {
        const { category, subcategory } = req.body;

        if (!category && !subcategory) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a category or sub-category name',
            });
        }

        let questions = [];
        let categoryExists = false;
        let subcategoryExists = false;

        if (subcategory) {
            subcategoryExists = await db.subcategory.findUnique({
                where: {
                    name: subcategory
                }
            });

            if (!subcategoryExists) {
                return res.status(404).json({
                    success: false,
                    message: 'Sub-category not found',
                });
            }

            if (category) {
                categoryExists = await db.category.findUnique({
                    where: {
                        name: category
                    },
                    include: {
                        subcategories: true
                    }
                });

                if (!categoryExists) {
                    return res.status(404).json({
                        success: false,
                        message: 'Category not found',
                    });
                }

                const isSubcategoryOfCategory = categoryExists.subcategories.some(sub => sub.name === subcategory);
                if (!isSubcategoryOfCategory) {
                    return res.status(400).json({
                        success: false,
                        message: 'Sub-category does not belong to the specified category',
                    });
                }
            }

            questions = await db.questionMetadata.findMany({
                where: {
                    subcategories: {
                        some: {
                            name: subcategory
                        }
                    }
                },
                select: {
                    id: true,
                    question: true,
                    relatedQAIds: true
                }
            });
        } else if (category) {
            categoryExists = await db.category.findUnique({
                where: {
                    name: category
                }
            });

            if (!categoryExists) {
                return res.status(404).json({
                    success: false,
                    message: 'Category not found',
                });
            }

            questions = await db.questionMetadata.findMany({
                where: {
                    categories: {
                        some: {
                            name: category
                        }
                    }
                },
                select: {
                    id: true,
                    question: true,
                    relatedQAIds: true
                }
            });
        }

        const filteredQuestions = questions.filter(question => question.question !== '-1');
        
        const sortedQuestions = filteredQuestions.map(question => ({
            ...question,
            Count: question.relatedQAIds.length,
        })).sort((a, b) => b.Count - a.Count);

        res.json({
            success: true,
            message: 'Done',
            data: sortedQuestions,
            questionCount: sortedQuestions.length
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


const { db } = require('../../db.js');

const parseDateInput = (dateStr) => {
    const [month, day, year] = dateStr.split('/').map(Number);
    return { day, month, year };
};

const userCount=async(req,res)=>{
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
        const uniqueUsers = await prisma.qA.findMany({
            where: {
                createdAt: {
                    gte: new Date(startDate),
                    lte: new Date(endDate),
                },
            },
            select: {
                userId: true,
            },
            distinct: ['userId'],
        });

        res.json({
            success: true,
            message: 'Unique User Data fetched successfully',
            userCount: uniqueUsers.length,
            userIdsList:uniqueUsers
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

module.exports=userCount
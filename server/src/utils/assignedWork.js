export const assignedWorkWhere = (userId) => ({
    OR: [
        { defaultTechId: userId },
        { visits: { some: { assignedTechId: userId } } },
    ],
});
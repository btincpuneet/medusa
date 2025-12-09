"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchAdminUserByEmail = exports.fetchAdminUsersByIds = exports.fetchAdminUserById = void 0;
const utils_1 = require("@medusajs/framework/utils");
const mapResultToSummary = (user) => ({
    id: user.id,
    email: user.email,
    first_name: user.first_name ?? null,
    last_name: user.last_name ?? null,
    metadata: user.metadata ?? null,
});
const fetchAdminUserById = async (scope, userId) => {
    const remoteQuery = scope.resolve(utils_1.ContainerRegistrationKeys.REMOTE_QUERY);
    const query = (0, utils_1.remoteQueryObjectFromString)({
        entryPoint: "user",
        variables: {
            filters: { id: userId },
        },
        fields: ["id", "email", "first_name", "last_name", "metadata"],
    });
    const result = await remoteQuery(query);
    const user = result?.[0];
    return user ? mapResultToSummary(user) : null;
};
exports.fetchAdminUserById = fetchAdminUserById;
const fetchAdminUsersByIds = async (scope, userIds) => {
    if (!userIds.length) {
        return new Map();
    }
    const remoteQuery = scope.resolve(utils_1.ContainerRegistrationKeys.REMOTE_QUERY);
    const query = (0, utils_1.remoteQueryObjectFromString)({
        entryPoint: "user",
        variables: {
            filters: { id: userIds },
        },
        fields: ["id", "email", "first_name", "last_name", "metadata"],
    });
    const result = await remoteQuery(query);
    const map = new Map();
    for (const entry of result ?? []) {
        if (entry?.id) {
            map.set(entry.id, mapResultToSummary(entry));
        }
    }
    return map;
};
exports.fetchAdminUsersByIds = fetchAdminUsersByIds;
const fetchAdminUserByEmail = async (scope, email) => {
    if (!email) {
        return null;
    }
    const remoteQuery = scope.resolve(utils_1.ContainerRegistrationKeys.REMOTE_QUERY);
    const query = (0, utils_1.remoteQueryObjectFromString)({
        entryPoint: "user",
        variables: {
            filters: { email },
        },
        fields: ["id", "email", "first_name", "last_name", "metadata"],
    });
    const result = await remoteQuery(query);
    const user = result?.[0];
    return user ? mapResultToSummary(user) : null;
};
exports.fetchAdminUserByEmail = fetchAdminUserByEmail;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWRtaW4tdXNlcnMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvbGliL2FkbWluLXVzZXJzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLHFEQUdrQztBQWNsQyxNQUFNLGtCQUFrQixHQUFHLENBQUMsSUFBUyxFQUFvQixFQUFFLENBQUMsQ0FBQztJQUMzRCxFQUFFLEVBQUUsSUFBSSxDQUFDLEVBQUU7SUFDWCxLQUFLLEVBQUUsSUFBSSxDQUFDLEtBQUs7SUFDakIsVUFBVSxFQUFFLElBQUksQ0FBQyxVQUFVLElBQUksSUFBSTtJQUNuQyxTQUFTLEVBQUUsSUFBSSxDQUFDLFNBQVMsSUFBSSxJQUFJO0lBQ2pDLFFBQVEsRUFBRSxJQUFJLENBQUMsUUFBUSxJQUFJLElBQUk7Q0FDaEMsQ0FBQyxDQUFBO0FBRUssTUFBTSxrQkFBa0IsR0FBRyxLQUFLLEVBQ3JDLEtBQVksRUFDWixNQUFjLEVBQ29CLEVBQUU7SUFDcEMsTUFBTSxXQUFXLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FDL0IsaUNBQXlCLENBQUMsWUFBWSxDQUNELENBQUE7SUFFdkMsTUFBTSxLQUFLLEdBQUcsSUFBQSxtQ0FBMkIsRUFBQztRQUN4QyxVQUFVLEVBQUUsTUFBTTtRQUNsQixTQUFTLEVBQUU7WUFDVCxPQUFPLEVBQUUsRUFBRSxFQUFFLEVBQUUsTUFBTSxFQUFFO1NBQ3hCO1FBQ0QsTUFBTSxFQUFFLENBQUMsSUFBSSxFQUFFLE9BQU8sRUFBRSxZQUFZLEVBQUUsV0FBVyxFQUFFLFVBQVUsQ0FBQztLQUMvRCxDQUFDLENBQUE7SUFFRixNQUFNLE1BQU0sR0FBRyxNQUFNLFdBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQTtJQUN2QyxNQUFNLElBQUksR0FBRyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQTtJQUV4QixPQUFPLElBQUksQ0FBQyxDQUFDLENBQUMsa0JBQWtCLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQTtBQUMvQyxDQUFDLENBQUE7QUFwQlksUUFBQSxrQkFBa0Isc0JBb0I5QjtBQUVNLE1BQU0sb0JBQW9CLEdBQUcsS0FBSyxFQUN2QyxLQUFZLEVBQ1osT0FBaUIsRUFDdUIsRUFBRTtJQUMxQyxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRSxDQUFDO1FBQ3BCLE9BQU8sSUFBSSxHQUFHLEVBQUUsQ0FBQTtJQUNsQixDQUFDO0lBRUQsTUFBTSxXQUFXLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FDL0IsaUNBQXlCLENBQUMsWUFBWSxDQUNELENBQUE7SUFFdkMsTUFBTSxLQUFLLEdBQUcsSUFBQSxtQ0FBMkIsRUFBQztRQUN4QyxVQUFVLEVBQUUsTUFBTTtRQUNsQixTQUFTLEVBQUU7WUFDVCxPQUFPLEVBQUUsRUFBRSxFQUFFLEVBQUUsT0FBTyxFQUFFO1NBQ3pCO1FBQ0QsTUFBTSxFQUFFLENBQUMsSUFBSSxFQUFFLE9BQU8sRUFBRSxZQUFZLEVBQUUsV0FBVyxFQUFFLFVBQVUsQ0FBQztLQUMvRCxDQUFDLENBQUE7SUFFRixNQUFNLE1BQU0sR0FBRyxNQUFNLFdBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQTtJQUN2QyxNQUFNLEdBQUcsR0FBRyxJQUFJLEdBQUcsRUFBNEIsQ0FBQTtJQUUvQyxLQUFLLE1BQU0sS0FBSyxJQUFJLE1BQU0sSUFBSSxFQUFFLEVBQUUsQ0FBQztRQUNqQyxJQUFJLEtBQUssRUFBRSxFQUFFLEVBQUUsQ0FBQztZQUNkLEdBQUcsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLEVBQUUsRUFBRSxrQkFBa0IsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFBO1FBQzlDLENBQUM7SUFDSCxDQUFDO0lBRUQsT0FBTyxHQUFHLENBQUE7QUFDWixDQUFDLENBQUE7QUE5QlksUUFBQSxvQkFBb0Isd0JBOEJoQztBQUVNLE1BQU0scUJBQXFCLEdBQUcsS0FBSyxFQUN4QyxLQUFZLEVBQ1osS0FBYSxFQUNxQixFQUFFO0lBQ3BDLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUNYLE9BQU8sSUFBSSxDQUFBO0lBQ2IsQ0FBQztJQUVELE1BQU0sV0FBVyxHQUFHLEtBQUssQ0FBQyxPQUFPLENBQy9CLGlDQUF5QixDQUFDLFlBQVksQ0FDRCxDQUFBO0lBRXZDLE1BQU0sS0FBSyxHQUFHLElBQUEsbUNBQTJCLEVBQUM7UUFDeEMsVUFBVSxFQUFFLE1BQU07UUFDbEIsU0FBUyxFQUFFO1lBQ1QsT0FBTyxFQUFFLEVBQUUsS0FBSyxFQUFFO1NBQ25CO1FBQ0QsTUFBTSxFQUFFLENBQUMsSUFBSSxFQUFFLE9BQU8sRUFBRSxZQUFZLEVBQUUsV0FBVyxFQUFFLFVBQVUsQ0FBQztLQUMvRCxDQUFDLENBQUE7SUFFRixNQUFNLE1BQU0sR0FBRyxNQUFNLFdBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQTtJQUN2QyxNQUFNLElBQUksR0FBRyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQTtJQUV4QixPQUFPLElBQUksQ0FBQyxDQUFDLENBQUMsa0JBQWtCLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQTtBQUMvQyxDQUFDLENBQUE7QUF4QlksUUFBQSxxQkFBcUIseUJBd0JqQyJ9
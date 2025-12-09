"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.collectAllowedGuestDomains = void 0;
const redington_config_1 = require("../redington-config");
const pg_1 = require("../../lib/pg");
const normalizeList = (values) => {
    return Array.from(new Set(values
        .map((value) => value.trim())
        .filter((value) => value.length > 0))).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
};
const collectAllowedGuestDomains = async () => {
    const configDomains = normalizeList(redington_config_1.redingtonConfig.guestUsers.allowedDomains ?? []);
    const databaseDomains = normalizeList(await (0, pg_1.listActiveDomainNames)());
    const extensionNames = normalizeList(await (0, pg_1.listActiveDomainExtensionNames)());
    const allowedSet = new Set();
    for (const domain of configDomains) {
        allowedSet.add(domain.toLowerCase());
    }
    for (const domain of databaseDomains) {
        allowedSet.add(domain.toLowerCase());
    }
    const allowed = Array.from(allowedSet)
        .map((domain) => domain.trim())
        .filter((domain) => domain.length > 0)
        .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
    return {
        allowed,
        config: configDomains,
        database: databaseDomains,
        extensions: extensionNames,
    };
};
exports.collectAllowedGuestDomains = collectAllowedGuestDomains;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9zcmMvbW9kdWxlcy9yZWRpbmd0b24tZ3Vlc3QtdXNlci9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSwwREFBcUQ7QUFDckQscUNBR3FCO0FBRXJCLE1BQU0sYUFBYSxHQUFHLENBQUMsTUFBZ0IsRUFBWSxFQUFFO0lBQ25ELE9BQU8sS0FBSyxDQUFDLElBQUksQ0FDZixJQUFJLEdBQUcsQ0FDTCxNQUFNO1NBQ0gsR0FBRyxDQUFDLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUM7U0FDNUIsTUFBTSxDQUFDLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxLQUFLLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUN2QyxDQUNGLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxDQUFDLEVBQUUsU0FBUyxFQUFFLEVBQUUsV0FBVyxFQUFFLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQTtBQUMxRSxDQUFDLENBQUE7QUFTTSxNQUFNLDBCQUEwQixHQUNyQyxLQUFLLElBQXdDLEVBQUU7SUFDN0MsTUFBTSxhQUFhLEdBQUcsYUFBYSxDQUNqQyxrQ0FBZSxDQUFDLFVBQVUsQ0FBQyxjQUFjLElBQUksRUFBRSxDQUNoRCxDQUFBO0lBRUQsTUFBTSxlQUFlLEdBQUcsYUFBYSxDQUFDLE1BQU0sSUFBQSwwQkFBcUIsR0FBRSxDQUFDLENBQUE7SUFDcEUsTUFBTSxjQUFjLEdBQUcsYUFBYSxDQUNsQyxNQUFNLElBQUEsbUNBQThCLEdBQUUsQ0FDdkMsQ0FBQTtJQUVELE1BQU0sVUFBVSxHQUFHLElBQUksR0FBRyxFQUFVLENBQUE7SUFDcEMsS0FBSyxNQUFNLE1BQU0sSUFBSSxhQUFhLEVBQUUsQ0FBQztRQUNuQyxVQUFVLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFBO0lBQ3RDLENBQUM7SUFDRCxLQUFLLE1BQU0sTUFBTSxJQUFJLGVBQWUsRUFBRSxDQUFDO1FBQ3JDLFVBQVUsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLFdBQVcsRUFBRSxDQUFDLENBQUE7SUFDdEMsQ0FBQztJQUVELE1BQU0sT0FBTyxHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDO1NBQ25DLEdBQUcsQ0FBQyxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxDQUFDO1NBQzlCLE1BQU0sQ0FBQyxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsTUFBTSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUM7U0FDckMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxDQUFDLEVBQUUsU0FBUyxFQUFFLEVBQUUsV0FBVyxFQUFFLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQTtJQUV6RSxPQUFPO1FBQ0wsT0FBTztRQUNQLE1BQU0sRUFBRSxhQUFhO1FBQ3JCLFFBQVEsRUFBRSxlQUFlO1FBQ3pCLFVBQVUsRUFBRSxjQUFjO0tBQzNCLENBQUE7QUFDSCxDQUFDLENBQUE7QUE5QlUsUUFBQSwwQkFBMEIsOEJBOEJwQyJ9
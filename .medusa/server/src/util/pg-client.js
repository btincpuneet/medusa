"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = client;
const pg_1 = require("pg");
function client() {
    return new pg_1.Client({
        connectionString: process.env.DATABASE_URL
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGctY2xpZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL3V0aWwvcGctY2xpZW50LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBRUEseUJBSUM7QUFORCwyQkFBMkI7QUFFM0IsU0FBd0IsTUFBTTtJQUM1QixPQUFPLElBQUksV0FBTSxDQUFDO1FBQ2hCLGdCQUFnQixFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsWUFBWTtLQUMzQyxDQUFDLENBQUE7QUFDSixDQUFDIn0=
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
const SAMPLE_CSV = `Subscription Code,Access Id,Company Code,First Name,Last Name,Email,Status
HELLO10,6,1140,Test,Subscription,testsubscription@mailinator.com,1
WELCOME20DPS,7,9110,DPS,School,dps@gmail.com,1
10SGS0H-F002,6,1140,test,test,test123@mailinator.com,1
`;
async function GET(req, res) {
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", 'attachment; filename="subscription-codes-sample.csv"');
    return res.send(SAMPLE_CSV);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL2FkbWluL3JlZGluZ3Rvbi9zdWJzY3JpcHRpb24tY29kZXMvc2FtcGxlL3JvdXRlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBUUEsa0JBUUM7QUFkRCxNQUFNLFVBQVUsR0FBRzs7OztDQUlsQixDQUFBO0FBRU0sS0FBSyxVQUFVLEdBQUcsQ0FBQyxHQUFrQixFQUFFLEdBQW1CO0lBQy9ELEdBQUcsQ0FBQyxTQUFTLENBQUMsY0FBYyxFQUFFLFVBQVUsQ0FBQyxDQUFBO0lBQ3pDLEdBQUcsQ0FBQyxTQUFTLENBQ1gscUJBQXFCLEVBQ3JCLHNEQUFzRCxDQUN2RCxDQUFBO0lBRUQsT0FBTyxHQUFHLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFBO0FBQzdCLENBQUMifQ==
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

const SAMPLE_CSV = `Subscription Code,Access Id,Company Code,First Name,Last Name,Email,Status
HELLO10,6,1140,Test,Subscription,testsubscription@mailinator.com,1
WELCOME20DPS,7,9110,DPS,School,dps@gmail.com,1
10SGS0H-F002,6,1140,test,test,test123@mailinator.com,1
`

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  res.setHeader("Content-Type", "text/csv")
  res.setHeader(
    "Content-Disposition",
    'attachment; filename="subscription-codes-sample.csv"'
  )

  return res.send(SAMPLE_CSV)
}

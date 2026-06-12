import type { Request, Response } from "express"
import app from "./app"
import "dotenv/config"

const port = process.env.PORT || 3000

app.get("/", (req: Request, res: Response) => {
  res.json("Salma Florist API is running")
})

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`)
})

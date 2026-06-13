import type { Request, Response } from "express"
import app from "./app"
import "dotenv/config"
import config from "./config"

// check config
for (const key in config) {
  if (!config[key as keyof typeof config]) {
    throw new Error(`Missing environment variable: ${key}`)
  }
}

const port = process.env.PORT || 3000

app.get("/", (req: Request, res: Response) => {
  res.json("Salma Florist API is running")
})

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`)
})

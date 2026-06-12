class ErrorResponse {
  message: string
  status: number
  errors: object
  constructor(message: string, status = 500, errors = {}) {
    this.message = message
    this.status = status
    this.errors = errors
  }
}

export { ErrorResponse }

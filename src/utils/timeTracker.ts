class TimeTracker {
  private startTime: Date | null
  private endTime: Date | null

  constructor() {
    this.startTime = null
    this.endTime = null
  }

  public start(): void {
    this.startTime = new Date()
  }

  public stop(): void {
    this.endTime = new Date()
  }

  getElapsedTime() {
    if (this.startTime === null) {
      return { hours: 0, minutes: 0, seconds: 0 }
    }

    const endTime = this.endTime === null ? new Date() : this.endTime
    const elapsedTime = endTime.getTime() - this.startTime.getTime()

    const hours = Math.floor(elapsedTime / (1000 * 60 * 60))
    const minutes = Math.floor((elapsedTime % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((elapsedTime % (1000 * 60)) / 1000)

    return `Elapsed time: ${hours}h ${minutes}m ${seconds}s`
  }
}

export const timeTracker = new TimeTracker()

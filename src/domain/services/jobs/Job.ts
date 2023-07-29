import { CronJob } from 'cron'

export abstract class Job {
	protected abstract job: CronJob

	async start(): Promise<void> {
		this.job.start()
	}
}

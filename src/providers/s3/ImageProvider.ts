import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

export class ImageProvider {
	private s3client: S3Client

	constructor() {
		this.s3client = new S3Client({
			region: 'us-east-1',
			endpoint: process.env.S3_ENDPOINT,
			credentials: {
				accessKeyId: process.env.S3_ACCESS_KEY ?? '',
				secretAccessKey: process.env.S3_SECRET_KEY ?? '',
			},
		})
	}

	async getPresignedUrl(objectId: string): Promise<string> {
		const command = new GetObjectCommand({
			Bucket: process.env.S3_BUCKET_NAME,
			Key: objectId,
		})

		const url = await getSignedUrl(this.s3client, command, { expiresIn: 3600 * 24 }) // URL expires in 24 hour

		return url
	}

	async uploadFile(file: Buffer, fileName: string): Promise<string> {
		const uploadCommand = new PutObjectCommand({
			Bucket: process.env.S3_BUCKET_NAME,
			Key: fileName,
			Body: file,
		})

		await this.s3client.send(uploadCommand)

		return this.getPresignedUrl(fileName)
	}
}

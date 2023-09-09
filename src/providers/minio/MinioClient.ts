import { Client, UploadedObjectInfo } from 'minio'

export class MinioClient {
	private readonly client: Client

	constructor() {
		this.client = new Client({
			endPoint: process.env.MINIO_HOST!,
			useSSL: true,
			accessKey: process.env.MINIO_ACCESSKEY!,
			secretKey: process.env.MINIO_SECRETKEY!,
		})
	}

	async getFile(objectName: string): Promise<string> {
		return this.client.presignedGetObject('gam8-images', objectName)
	}

	async putFile(objectName: string, stream: Buffer): Promise<UploadedObjectInfo> {
		return this.client.putObject('gam8-images', objectName, stream)
	}
}

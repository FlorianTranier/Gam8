import joinImages from 'join-images'
import sharp from 'sharp'

async function mergeImagesHorizontal(imgSource1: string | Buffer, imgSource2: string | Buffer): Promise<Buffer> {
	return (await joinImages([imgSource1, imgSource2], { direction: 'horizontal' })).png().toBuffer()
}

async function mergeImagesVertical(imgSource1: string | Buffer, imgSource2: string | Buffer): Promise<Buffer> {
	return (await joinImages([imgSource1, imgSource2], { direction: 'vertical', align: 'center' })).png().toBuffer()
}

export async function mergeImages(
	imgSource1: string,
	imgSource2: string,
	imgSource3: string | undefined = undefined,
	imgSource4: string | undefined = undefined
): Promise<Buffer> {
	const img1 = await sharp(Buffer.from(await (await fetch(imgSource1)).arrayBuffer()))
		.resize(640, 360, { fit: 'fill' })
		.toBuffer()
	const img2 = await sharp(Buffer.from(await (await fetch(imgSource2)).arrayBuffer()))
		.resize(640, 360, { fit: 'fill' })
		.toBuffer()

	const firstImagePromise = mergeImagesHorizontal(img1, img2)

	if (imgSource3 === undefined) return firstImagePromise

	const img3 = await sharp(Buffer.from(await (await fetch(imgSource3)).arrayBuffer()))
		.resize(640, 360, { fit: 'fill' })
		.toBuffer()

	if (imgSource4 === undefined) return mergeImagesVertical(await firstImagePromise, img3)

	const img4 = await sharp(Buffer.from(await (await fetch(imgSource4)).arrayBuffer()))
		.resize(640, 360, { fit: 'fill' })
		.toBuffer()

	const secondImagePromise = mergeImagesHorizontal(img3, img4)

	const [firstImage, secondImage] = await Promise.all([firstImagePromise, secondImagePromise])

	return mergeImagesVertical(firstImage, secondImage)
}

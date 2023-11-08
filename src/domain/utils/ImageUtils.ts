import joinImages from 'join-images'
import sharp from 'sharp'

async function mergeImagesHorizontal(imgSource1: string | Buffer, imgSource2: string | Buffer): Promise<Buffer> {
	return (await joinImages([imgSource1, imgSource2], { direction: 'horizontal' })).png().toBuffer()
}

async function mergeImagesVertical(imgSource1: string | Buffer, imgSource2: string | Buffer): Promise<Buffer> {
	return (await joinImages([imgSource1, imgSource2], { direction: 'vertical' })).png().toBuffer()
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
	const img3 = await sharp(Buffer.from(await (await fetch(imgSource3 ?? '')).arrayBuffer()))
		.resize(640, 360, { fit: 'fill' })
		.toBuffer()
	const img4 = await sharp(Buffer.from(await (await fetch(imgSource4 ?? '')).arrayBuffer()))
		.resize(640, 360, { fit: 'fill' })
		.toBuffer()

	console.debug(1)

	const firstImagePromise = mergeImagesHorizontal(img1, img2)

	console.debug(2)

	if (imgSource3 === undefined) return firstImagePromise

	console.debug(3)

	if (imgSource4 === undefined) return mergeImagesVertical(await firstImagePromise, img3)

	console.debug(4)

	const secondImagePromise = mergeImagesHorizontal(img3, img4)

	console.debug(5)

	const [firstImage, secondImage] = await Promise.all([firstImagePromise, secondImagePromise])

	console.debug(6)

	return mergeImagesVertical(firstImage, secondImage)
}

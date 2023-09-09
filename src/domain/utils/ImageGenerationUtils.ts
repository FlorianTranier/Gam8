import cp from 'child_process'
import { Readable, Writable } from 'stream'
import fs from 'fs/promises'

// ffmpeg -i input0 -i input1 -i input2 -i input3 -filter_complex "[0:v][1:v][2:v][3:v]xstack=inputs=4:layout=0_0|w0_0|0_h0|w0_h0[v]" -map "[v]" output

export const mergeImages = async (
	img1: Readable,
	img2: Readable,
	img3: Readable,
	img4: Readable
): Promise<Readable> => {
	const img1File = await fs.writeFile('img1.jpg', '')
	img1.pipe(img1File)

	const ffmpegProcess = cp.spawn(
		'ffmpeg',
		[
			'-i',
			'pipe:3',
			'-i',
			'pipe:4',
			'-i',
			'pipe:5',
			'-i',
			'pipe:6',
			'--filter_complex',
			'"xstack=inputs=4:layout=0_0|w0_0|0_h0|w0_h0"',
			'-f',
			'jpg',
			'pipe:1',
		],
		{
			windowsHide: true,
			stdio: ['inherit', 'pipe', 'inherit', 'pipe', 'pipe', 'pipe', 'pipe'],
		}
	)

	img1.pipe(<Writable>ffmpegProcess.stdio[3])
	img2.pipe(<Writable>ffmpegProcess.stdio[4])
	img3.pipe(<Writable>ffmpegProcess.stdio[5])
	img4.pipe(<Writable>ffmpegProcess.stdio[6])

	return <Readable>ffmpegProcess.stdio[1]
}

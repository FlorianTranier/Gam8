export const emojiCounter = (num: number) => {
  if (num <= 0) return ''

	const emojiMap: { [key: number]: string } = {
		1: `1️⃣`,
		2: `2️⃣`,
		3: `3️⃣`,
		4: `4️⃣`,
		5: `5️⃣`,
		6: `6️⃣`,
		7: `7️⃣`,
		8: `8️⃣`,
		9: `9️⃣`,
	}

	return emojiMap[num] || `9️⃣➕`
}

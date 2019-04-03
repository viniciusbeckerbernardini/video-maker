const algorithmia = require('algorithmia')
const algorithmiaKey = require('../credentials/key.json').apiKey
const sentenceBoundaryDetection = require('sbd')

async function robot(content){
	await fetchContentFromWikipedia(content)
	sanitizeContent(content)
	breakContentSentences(content)

	async function fetchContentFromWikipedia(content){
		const algorithmiaAuthencitcated = algorithmia(algorithmiaKey)
		const wikipediaAlgorithm = algorithmiaAuthencitcated.algo('web/WikipediaParser/0.1.2?')
		const wikipediaResponse  = await wikipediaAlgorithm.pipe(content.searchTerm)
		const wikipediaContent = wikipediaResponse.get()

		content.sourceContentOriginal = wikipediaContent.content
	}

	function sanitizeContent(content){
		const withoutBlankLinesAndMarkdown = removeBlankLinesAndMarkdown(content.sourceContentOriginal)
		const withoutDatesInParantheases = removeDatesInParentheases(withoutBlankLinesAndMarkdown)

		content.sourceContentSanitized = withoutDatesInParantheases

		function removeBlankLinesAndMarkdown(text){
			const allLines = text.split('\n')

			const withoutBlankLinesAndMarkdown = allLines.filter((line) => {
				if(line.trim().length === 0 || line.trim().startsWith('=')){
					return false
				}
				return true
			})
			return withoutBlankLinesAndMarkdown.join(' ')
		}
	}

	function removeDatesInParentheases(text){
		return text.replace(/\((?:\([^()]*\)|[^()])*\)/gm, '').replace(/  /g,' ')
	}

	function breakContentSentences(content){
		content.sentences = []
		const sentences = sentenceBoundaryDetection.sentences(content.sourceContentSanitized)
		sentences.forEach((sentence) => {
			content.sentences.push({
				text:sentence,
				keywords:[],
				images:[]
			})
		})
		console.log(sentences)
	}
}



module.exports = robot;
const algorithmia = require('algorithmia')
const algorithmiaKey = require('../credentials/algorithmia.json').apiKey
const sentenceBoundaryDetection = require('sbd')

const watsonApiKey = require('../credentials/watson.json').apikey
const NaturalLanguageUnderstandingV1 = require('watson-developer-cloud/natural-language-understanding/v1.js')

const nlu = new NaturalLanguageUnderstandingV1({
	iam_apikey: watsonApiKey,
	version: '2018-04-05',
	url: 'https://gateway.watsonplatform.net/natural-language-understanding/api/'
});

const state = require('./state.js')

async function robot(){
	const content = state.load();
	await fetchContentFromWikipedia(content)
	sanitizeContent(content)
	breakContentSentences(content)
	limitMaximumSentences(content)
	await fetchKeywordsOfAllSentences(content)

	state.save(content)

	async function fetchContentFromWikipedia(content){
		const algorithmiaAuthencitcated = algorithmia(algorithmiaKey)
		const wikipediaAlgorithm = algorithmiaAuthencitcated.algo('web/WikipediaParser/0.1.2?')
		const wikipediaResponse  = await wikipediaAlgorithm.pipe({"lang":"pt","articleName":content.searchTerm})
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
				categories:[],
				images:[]
			})
		})
	}

	function limitMaximumSentences(content){
		content.sentences = content.sentences.slice(0, content.maximumSentences)
	}

	async function fetchKeywordsOfAllSentences(content){
		for (const sentence of content.sentences) {
			sentence.keywords = await fetchWatsonAndReturnKeywords(sentence.text)
			sentence.categories = await fetchWastonAndReturnCategories(sentence.text)
		}
	}

	async function fetchWatsonAndReturnKeywords(sentence){
		return new Promise((resolve,reject)=>{
			nlu.analyze({
				text: sentence,
				features: {
					keywords: {},
				}
			}, (error,response)=>{
				if(error){
					throw error
				}
				const keywords = response.keywords.map((keyword) => {
					return keyword.text
				})
				resolve(keywords)
			})
		})
	}

	async function fetchWastonAndReturnCategories(sentence){
		return new Promise((resolve,reject) =>{
			nlu.analyze({
				text:sentence,
				features:{
					categories: {}	
				}
			}, (error,response) => {
				const categories = response.categories.map((category) => {
					return category.label;
				})
				resolve(categories);
			})
		})
	}
}



module.exports = robot;
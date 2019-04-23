const readline = require('readline-sync') 
const state = require('./state.js')

function robot(){
	const content = {
		maximumSentences: 10
	}

	content.searchTerm = askAndReturnSearchTerm()
	content.prefix = askAndReturnPrefix()
	state.save(content);

	function askAndReturnSearchTerm(){
		return readline.question("Escreva um termo de pesquisa do Wikipedia: ")
	}

	function askAndReturnPrefix(){
		const prefixes = ['Quem é','O que é','A história de']
		const selectedPrefixIndex = readline.keyInSelect(prefixes, 'Escolha uma opção:')
		const selectedPrefixText = prefixes[selectedPrefixIndex]
		return selectedPrefixText
	}
}

module.exports = robot
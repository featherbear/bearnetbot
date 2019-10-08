const TrelloAPI = require('trello')
const config = require('../.config')

let trello = new TrelloAPI(config.trello_key, config.trello_token)

const boardName = 'BearNet Bot'
const listName = 'Todo'

let boardId = null
let listId = null

let isReady = false

async function init () {
  let boards = await trello.getBoards(config.trello_user)

  let board = boards.find(b => b.name == boardName)
  if (!board) board = await trello.addBoard(boardName)

  boardId = board.id

  let lists = await trello.getListsOnBoard(boardId)

  let list = lists.find(l => l.name == listName)
  if (!list) list = await trello.addListToBoard(boardId, listName)

  listId = list.id

  isReady = true
}

module.exports = function (api) {
  return {
    name: ['todo'],
    admin: false,
    description: 'Brb completing bucketlist!',
    onPreLoad: init,
    function: async function (messageObj, message) {
      if (!isReady) throw new Error('Command not ready yet')

      async function view () {
        let cards = await trello.getCardsForList(listId)
        let results = []

        for (let i = 0; i < cards.length; i++) {
          results.push(`${i + 1}. ${cards[i].name}`)
        }

        return results.join('\n')
      }

      if (message.length == 0) {
        return await view()
      }

      let messages = message.split(' ')

      let action = messages[0]
      let content = messages.slice(1).join(' ')

      switch (action.toLowerCase()) {
        case 'add':
          if (content.length == 0) throw new Error('Supply an entry name!')
          await trello.addCard(content, null, listId)

          return 'Added item!'
        case 'delete':
        case 'remove':
          if (content.length == 0) throw new Error('Supply an entry name!')

          let cards = await trello.getCardsForList(listId)
          let card = cards.find(c => c.name == content)

          if (!card) {
            throw new Error('Entry not found!')
          }

          await trello.deleteCard(card.id)

          return 'Entry deleted!'

        case 'show':
        case 'list':
        case 'view':
          return await view()

        default:
          throw new Error('Invalid command!')
      }
    }
  }
}

const nameInput = document.getElementById('name')
const registerNameDiv = document.getElementById('register-name')
const playersDiv = document.getElementById('players')
const buttonDiv = document.getElementById('button')
const chairButton = document.getElementById('chair')
const gameStateParagraph = document.getElementById('game-state')

const API_URL = window.location.hostname === 'localhost' ? 'http://localhost:1881/' : 'https://chair-game-api.djupvik.dev/';

// STATE
let registeredName = null
let players = []
let reactionStart = null
let reactionResult = null

const show = (element) => element.style.display = 'block'
const hide = (element) => element.style.display = 'none'

function updateHtml() {
    gameStateParagraph.innerHTML = reactionStart ? 'Game has started' : 'waiting for players...'

    registeredName || reactionStart ? hide(registerNameDiv) : show(registerNameDiv)

    playersDiv.innerHTML = ''
    players.forEach((player) => {
        const playerElement = document.createElement('li')
        playerElement.innerHTML = player
        playersDiv.appendChild(playerElement)
    })

    registeredName && reactionStart ? show(buttonDiv) : hide(buttonDiv)
    chairButton.innerHTML = reactionStart > Date.now() ? 'wait for green' : 'click'
}

async function register() {
    const name = nameInput.value.trim()

    if (!name) {
        alert('name field cannot be empty')
        return
    }

    const data = { name: name }

    const result = await fetch(API_URL + 'register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    })

    if (result.status != 200) {
        alert(result.text())
        return
    }

    registeredName = name


    updateGameState()
}

async function chair() {
    const reaction = Date.now() - reactionStart

    const data = {
        name: registeredName,
        reaction: reaction,
    }

    const result = await fetch(API_URL + 'results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    })

    if (result.status != 200) {
        alert(result.text())
        return
    }

    reactionResult = reaction
    updateHtml()
}

async function updateGameState() {
    const result = await fetch(API_URL + 'game?=' + new Date().getTime())

    if (result.status != 200) {
        alert(result.text())
        return
    }

    const json = await result.json()
    players = json.players

    if (reactionStart != json.reactionStart) {
        reactionStart = json.reactionStart
        const delay = reactionStart - Date.now()
        const sleep = new Promise(resolve => setTimeout(resolve, delay))
        sleep.then(updateHtml)
    }

    updateHtml()
}

setInterval(updateGameState, 1500)
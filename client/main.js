const nameInput = document.getElementById('name')
const registerNameDiv = document.getElementById('register-name')
const playersDiv = document.getElementById('players')
const buttonDiv = document.getElementById('button')
const chairButton = document.getElementById('chair')
const gameStateParagraph = document.getElementById('game-state')
const registeredNameParagraph = document.getElementById('registered-name')

const API_URL = window.location.hostname === 'localhost' ? 'http://localhost:1881/' : 'https://chair-game-api.djupvik.dev/';

// STATE
let registeredName = null
let players = []
let reactionStart = null
let reactionResult = null
let started = false

const show = (element) => element.style.display = 'block'
const hide = (element) => element.style.display = 'none'

function updateHtml() {
    registeredNameParagraph.innerHTML = registeredName ? `Your Name: ${registeredName}` : ''

    gameStateParagraph.innerHTML = started ? 'Game has started' : 'waiting for players...'

    registeredName || started ? hide(registerNameDiv) : show(registerNameDiv)

    playersDiv.innerHTML = ''
    players.forEach((player) => {
        const playerElement = document.createElement('li')
        playerElement.innerHTML = player
        playersDiv.appendChild(playerElement)
    })

    registeredName && reactionStart ? show(buttonDiv) : hide(buttonDiv)

    chairButton.disabled = !!reactionResult

    if (reactionResult) {
        chairButton.innerHTML = reactionResult > 0 ? Math.round(reactionResult) : 'too early!'
        chairButton.className = reactionResult > 0 ? 'blue' : 'red'
    } else {
        chairButton.innerHTML = reactionStart > Date.now() ? 'wait for green' : 'click'
        chairButton.className = reactionStart > Date.now() ? null : 'green'
    }
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
        alert(await result.text())
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
        alert(await result.text())
        return
    }

    reactionResult = reaction
    updateHtml()
}

async function updateGameState() {
    const result = await fetch(API_URL + 'game?=' + new Date().getTime())

    if (result.status != 200) {
        alert(await result.text())
        return
    }

    const json = await result.json()

    if (json.started && players.includes(registeredName) && !json.players.includes(registeredName)) {
        alert('You were eliminated lmao!')
    }

    players = json.players
    started = json.started

    if (players.length == 0) registeredName = null

    if (json.reactionStart == null) {
        reactionStart = null
        reactionResult = null
    } else if (reactionStart != json.reactionStart) {
        reactionStart = json.reactionStart
        const delay = reactionStart - Date.now()
        const sleep = new Promise(resolve => setTimeout(resolve, delay))
        sleep.then(updateHtml)
    }

    updateHtml()
}

setInterval(updateGameState, 1500)
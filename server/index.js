const cors = require('cors')
const express = require('express')
const helmet = require('helmet')
const morgan = require('morgan')
const _ = require('underscore')
const fs = require('fs')
var path = require('path')

const app = express()

app.use(helmet())
app.use(morgan('tiny'))
app.use(cors())
app.use(express.json())

const port = process.env.PORT || 1881

function loadData() {
    const filePath = path.join(__dirname, 'data.json')

    try {
        return JSON.parse(fs.readFileSync(filePath, 'utf8'))
    } catch {
        return {
            players: {},
            reactionStart: null,
            started: false,
        }
    }
}

let { players, reactionStart, started } = loadData()

function saveData() {
    const data = {
        players: players,
        reactionStart: reactionStart,
        started: started,
    }

    const filePath = path.join(__dirname, 'data.json')

    try {
        fs.writeFileSync(filePath, JSON.stringify(data))
    } catch {
        fs.appendFileSync(filePath, JSON.stringify(data))
    }
}

app.post('/register', (req, res) => {
    if (started) {
        res.status(400).send('game has already started')
        return
    }

    if (!('name' in req.body)) {
        res.status(400).send('please specify your name')
        return
    }

    const name = req.body.name

    if (name in players) {
        res.status(400).send(`the name "${name}" is already registered`)
        return
    }

    players[name] = null
    saveData()

    res.status(200).send(`registered ${name}`)
})

app.post('/results', (req, res) => {
    if (!started) {
        res.status(400).send('the game has not started yet')
        return
    }

    if (!('name' in req.body)) {
        res.status(400).send('please specify your name')
        return
    }

    if (!('reaction' in req.body)) {
        res.status(400).send('please specify your reaction')
        return
    }

    const { name, reaction } = req.body

    if (!(name in players)) {
        res.status(400).send('you are not registered or you have been eliminated')
        return
    }

    if (reaction < 0) {
        delete players[name]
        saveData()
        res.status(200).send('you have been eliminated because you clicked too early')
        return
    }

    players[name] = reaction

    const notDonePlayers = _.values(players).filter((x) => x == null)
    if (notDonePlayers.length == 0) {
        const worstPlayer = Object.keys(players).reduce((a, b) => players[a] > players[b] ? a : b)
        delete players[worstPlayer]

        reactionStart = null
    }

    saveData()

    res.status(200).send('😁')
})

app.get('/game', (_, res) => {
    res.status(200).json(
        {
            players: Object.keys(players),
            reactionStart: reactionStart,
            started: started,
        }
    )
})

app.post('/start', (_, res) => {
    if (Object.keys(players).length < 2) {
        res.status(400).send('there must be at least two players')
        return
    }

    started = true

    for (const player in players) {
        players[player] = null
    }

    reactionStart = Date.now() + 1000 * 5 + Math.random() * 1000 * 5

    saveData()

    res.status(200).send(reactionStart.toString())
})

app.post('/clear', (_, res) => {
    reactionStart = null
    started = false
    for (const name in players) {
        delete players[name]
    }

    saveData()

    res.status(200).send('game is cleared')
})

app.listen(port, () => {
    console.log(`Listening at http://localhost:${port}`)
})
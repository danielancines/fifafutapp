const express = require('express')
const app = express()
const axios = require('axios')
const cors = require('cors')
const playersList = require('../files/players.info.json')

app.use(cors())
app.get('/players/:id', async (req, res) => {    
    if (!req.params.id){
        return res.Status(404).send({
            error: 'Player Code not provided'
        });
    }

    const assetId = req.params.id

    let lastPlayerId
    let lastSearchedPlayer
    function getPlayerName(id) {
        if (!lastSearchedPlayer || lastSearchedPlayer.id !== id)
            lastSearchedPlayer = playersList.Players.filter(p => p.id === id)[0]

        if (lastSearchedPlayer) {
            return lastSearchedPlayer.c || `${lastSearchedPlayer.f} ${lastSearchedPlayer.l}`
        } else {
            return 'Not Found'
        }
    }

    const config = {
        headers: {
            'X-UT-PHISHING-TOKEN': '301290310458641041',
            'X-UT-SID': '96440d0e-8465-4729-aa71-a9a544b59ddb'
        }
    }

    try {
        //const response = await axios.get(`https://utas.external.s2.fut.ea.com/ut/game/fifa18/transfermarket?start=0&num=50&type=player&maskedDefId=177003&_=1535476141124`, config)
        const response = await axios.all([
            axios.get(`https://utas.external.s2.fut.ea.com/ut/game/fifa18/transfermarket?start=0&num=50&type=player&maskedDefId=${assetId}&_=1535476141124`, config),
            axios.get(`https://utas.external.s2.fut.ea.com/ut/game/fifa18/transfermarket?start=51&num=50&type=player&maskedDefId=${assetId}&_=1535476141124`, config),
            axios.get(`https://utas.external.s2.fut.ea.com/ut/game/fifa18/transfermarket?start=102&num=50&type=player&maskedDefId=${assetId}&_=1535476141124`, config)
        ])
        if (response === undefined) {
            return res.send({ message: 'error' })
        }

        let result = []
        let minBuyNowPrice = 0
        let maxBuyNowPrice = 0
        let averageBuyNowPrice = 0

        response.map(resp => {
            resp.data.auctionInfo.map(player => {
                if (player.itemData.rareflag === 1) {
                    minBuyNowPrice = minBuyNowPrice == 0 ? player.buyNowPrice : ((player.buyNowPrice < minBuyNowPrice) ? player.buyNowPrice : minBuyNowPrice)
                    maxBuyNowPrice = maxBuyNowPrice == 0 ? player.buyNowPrice : ((player.buyNowPrice > maxBuyNowPrice) ? player.buyNowPrice : maxBuyNowPrice)
                    result.push({
                        id: player.itemData.assetId,
                        playerId: player.itemData.id,
                        name: getPlayerName(player.itemData.assetId),
                        buyNowPrice: player.buyNowPrice,
                        image: `https://www.easports.com/fifa/ultimate-team/web-app/content/B1BA185F-AD7C-4128-8A64-746DE4EC5A82/2018/fut/items/images/mobile/portraits/${player.itemData.assetId}.png`
                    })
                }
            })
        })

        // response.data.auctionInfo.map(player => {
        //     result.push({
        //         id: player.tradeId,
        //         playerId: player.itemData.id,
        //         name: getPlayerName(player.itemData.assetId),
        //         buyNowPrice: player.buyNowPrice,
        //         playerImage: `https://www.easports.com/fifa/ultimate-team/web-app/content/B1BA185F-AD7C-4128-8A64-746DE4EC5A82/2018/fut/items/images/mobile/portraits/${player.itemData.assetId}.png`
        //     })
        // })

        result.map(playerInfo => averageBuyNowPrice += playerInfo.buyNowPrice)

        res.send({
            id: result[0].id,
            name: result[0].name,
            image: result[0].image,
            count: result.length,
            minBuyNowPrice: minBuyNowPrice,
            maxBuyNowPrice: maxBuyNowPrice,
            averageBuyNowPrice: averageBuyNowPrice / result.length
        })
    } catch (error) {
        res.status(404).send(error.message)
    }

})

app.listen(3000, () => {
    console.log('Listen port 3000')
})



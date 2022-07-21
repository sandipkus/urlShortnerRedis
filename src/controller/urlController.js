const urlModel = require("../models/urlModel")
const { isValid, isValidBody, isValidUrl } = require("../validation/validation")
const shortId = require("shortid")
const redis = require("redis");

const { promisify } = require("util");

//Connect to redis
const redisClient = redis.createClient(
  14955,
  "redis-14955.c301.ap-south-1-1.ec2.cloud.redislabs.com",
  { no_ready_check: true }
);
redisClient.auth("qAyFTxP0xZuMzYZ9vZWX70fH6B0oUFaX", function (err) {
  if (err) throw err;
});

redisClient.on("connect", async function () {
  console.log("Connected to sameer's_Redis..");
});

const SET_ASYNC = promisify(redisClient.SET).bind(redisClient);
const GET_ASYNC = promisify(redisClient.GET).bind(redisClient);

const createUrl = async function (req, res) {
  try {
    const body = req.body
    const { longUrl } = body

    if (!isValidBody(body)) return res.status(400).send({ status: false, message: "Body Should not be empty" })
    if (!("longUrl" in body)) return res.status(400).send({ status: false, message: "LongUrl Is required" })
    if (!isValid(longUrl)) return res.status(400).send({ status: false, message: "LongUrl Should not be empty" })
    if (!isValidUrl(longUrl)) return res.status(400).send({ status: false, message: `"${longUrl}" is not a Valid url` })

    let cacheData = await GET_ASYNC(`${longUrl}`)
    if (cacheData) {
      cacheData = JSON.parse(cacheData)
      if (cacheData) return res.status(200).send({ status: true, message: "Already created. Getting this data from the cache", data: cacheData })
    } else {
      let url = await urlModel.findOne({ longUrl: longUrl }).select({ longUrl: 1, shortUrl: 1, urlCode: 1, _id: 0 })
      if (url) return res.status(200).send({ status: true, message: "already created. getting this data from the database", data: url })

      shortId.characters('0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_=');
      let smallId = shortId.generate(longUrl)
      body.urlCode = smallId
      body.shortUrl = "https://localhost:3000/" + smallId
      let data = await urlModel.create(body)
      let selecteddata = { longUrl: data.longUrl, shortUrl: data.shortUrl, urlCode: data.urlCode }
      await SET_ASYNC(`${longUrl}`, JSON.stringify(selecteddata), 'ex', 60 * 5)
      res.status(201).send({ status: true, message: "Done", data: selecteddata })
    }
  }
  catch (err) {
    res.status(500).send({ status: false, message: err.message })
    console.log(err.message)
  }
}

const getUrl = async function (req, res) {
  try {
    let code = req.params.urlCode
    if (!shortId.isValid(code)) return res.status(400).send({ status: false, message: "Pls Enter Urlcode In valid Format" })
    let url = await GET_ASYNC(`${req.params.urlCode}`)
    if (url) {
      console.log(url);
      res.redirect(url)
    } else {
      let Url = await urlModel.findOne({ urlCode: code })
      if(!Url)return res.status(404).send({ status: false, message: "This Code doesnot exists" })
      await SET_ASYNC(`${req.params.urlCode}`, Url.longUrl)
      console.log(Url.longUrl);
      res.redirect(Url.longUrl);
    }
  }
  catch (err) {
    res.status(500).send({ status: false, message: err.message })
  }
}



const notFound = function (req, res) {
  res.status(404).send({ status: false, message: "Route not found" })
}

module.exports = { createUrl, getUrl, notFound }
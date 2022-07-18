const urlModel= require("../models/urlModel")
const {isValid,isValidBody,isValidUrl}= require("../validation/validation")
const shortId= require("shortid")
const createUrl= async function(req,res){
try{
    const body=req.body
    const {longUrl} = body

    if(!isValidBody(body)) return res.status(400).send({status:false,message:"Body Should not be empty"}) 
    if(!("longUrl" in body)) return res.status(400).send({status:false,message:"LongUrl Is required"})
    if(!isValid(longUrl)) return res.status(400).send({status:false,message:"LongUrl Should not be empty"})
    if(!isValidUrl(longUrl)) return res.status(400).send({status:false,message:`"${longUrl}" is not a Valid url`}) 
    if(await urlModel.findOne({longUrl:longUrl})) return res.status(400).send({status:false,message:`${longUrl} is already exists`})
    shortId.characters('0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_=');
    let smallId= shortId.generate(longUrl)
    console.log(smallId)
    body.urlCode=smallId
    body.shortUrl="https://localhost:3000/" + smallId
    let data =await urlModel.create(body)
    let selecteddata= {longUrl:data.longUrl,shortUrl:data.shortUrl,urlCode:data.urlCode}
    res.status(201).send({status:true,message:"Done",data:selecteddata})
}
catch (err){
    res.status(500).send({status:false,message:err.message})
    console.log(err.message)
}
}

const getUrl= async function(req,res){
try{
    let code= req.params.urlCode
    if(!shortId.isValid(code)) return res.status(400).send({status:false,message:"Pls Enter Urlcode In valid Format"})
    if(!(await urlModel.findOne({urlCode:code}))) return res.status(404).send({status:false,message:"This Code doesnot exists"})
    let url= await urlModel.findOne({urlCode:code}).select({longUrl:1,_id:0}) 
    console.log(url)
    res.status(308).send({status:true,data:`Redirecting to ${url.longUrl} `})
    }
    catch(err){
        res.status(500).send({status:false,message:err.message})
    }
}

const notFound= function(req,res){
    res.status(404).send({status:false,message:"Route not found"})
}
module.exports={createUrl,getUrl,notFound}
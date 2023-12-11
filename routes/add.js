const express = require('express');
const router = express.Router();

const mongoclient = require("mongodb").MongoClient;
const ObjId = require('mongodb').ObjectId;
const url ='mongodb+srv://gudwns1812:gudwns10113@cluster0.dkvhb8p.mongodb.net/?retryWrites=true&w=majority' ;

let mydb;
mongoclient.connect(url)
.then(result => {
    mydb = result.db('myboard');
})
router.use(express.static('public'));

router.get('/signin', (req, res) => {
	res.render('signin.ejs');
});
router.get('/save' , (req,res) => {
  res.render('saveContent.ejs');       //새로운 글 작성
})

router.get('/edit/:id', (req,res) => {
    console.log(req.params.id);
    let new_id = new ObjId(req.params.id);
    mydb
    .collection('post')
    .findOne({_id : new_id})
    .then((result) => {
      console.log(result);
      res.render('edit.ejs', {data : result});
    }).catch(err => {
      console.log(err);
      res.status(500).send();
    });
  })

module.exports = router;
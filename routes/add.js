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
//모듈및 데이터 받아오기 ---

router.get('/signin', (req, res) => {   //회원가입 페이지
	res.render('signin.ejs');
});
router.get('/save' , (req,res) => {    //새로운 content 작성 페이지
  res.render('saveContent.ejs');       //새로운 글 작성
})

router.get('/edit/:id', (req,res) => {    //수정페이지
    console.log(req.params.id);
    let new_id = new ObjId(req.params.id);  
    mydb
    .collection('post')
    .findOne({_id : new_id})              //포스트에서 _id가 일치하는 포스트 가져오기
    .then((result) => {
      console.log(result);
      res.render('edit.ejs', {data : result});
    }).catch(err => {
      console.log(err);
      res.status(500).send();
    });
  })

module.exports = router;
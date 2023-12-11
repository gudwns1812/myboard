const mongoclient = require("mongodb").MongoClient;
const ObjId = require('mongodb').ObjectId;
const url ='mongodb+srv://gudwns1812:gudwns10113@cluster0.dkvhb8p.mongodb.net/?retryWrites=true&w=majority' ;
let session = require('express-session');
let multer = require('multer');
const path = require('path');
let mydb;
mongoclient
  .connect(url)
  .then((client) => {
    mydb = client.db("myboard");
    
    app.listen(8080, function () {
      console.log("포트 8080으로 서버 대기중 ... ");
    });
  })
  .catch((err) => {
    console.log(err);
  });
const express = require("express");
const app = express();
const sha = require('sha256');
const bodyParser = require("body-parser");
const { ObjectId } = require("mongodb");
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static('public'));

// 라우터 객체 생성
const sessionRouter = require('./routes/session');
const addRouter = require('./routes/add');
const { reset } = require("nodemon");
const router = require("./routes/add");

app.use('/',addRouter);
app.use('/',sessionRouter);
app.use(session({
  secret : 'ask12291ja',
  resave : false,
  saveUninitialized: true,
}));
let storage = multer.diskStorage({              //이미지 파일을 하드디스크에 저장하는 함수
  destination : function(req,file, done) {
    done(null, './public/image')
  },
  filename : function(req,file,done) {
    done(null, file.originalname)
  }
})

let upload = multer({storage : storage});
let imagepath ='';        //이미지 파일 경로
let imageType = '';       //이미지 타입

app.post("/save", (req,res) => {
  let now = new Date();

  mydb.collection('account').insertOne(
    {Firstname : req.body.Firstname, Lastname : req.body.Lastname, Username : req.body.Username , userid : req.body.userid, userpw : sha(req.body.userpw), Sex : req.body.Sex ,date : now.getTime() , neighbor : [] , neighborId : [] } 
    ).then (result => {
      console.log('데이터 추가 성공');
      res.redirect('/');
    });
});

app.post("/login" , (req,res) => {
  console.log(req.body.id);
  let post;
  mydb.collection('account').findOne({ userid : req.body.userid }
    ).then( result => {
      if (result.userpw == sha(req.body.userpw)) {
        mydb.collection('post').find({userid : { $in: result.neighborId }}).toArray()
        .then( (neighbor) =>{
          post = neighbor;
        })
        req.session.user = result;
        console.log(req.session);
        res.render('index.ejs', {user: req.session.user , post : post});
      }else{
        res.render('login.ejs');
      }
    })
})

app.post("/delete", (req,res) => {
  console.log(req.body);
  let userid = req.body.userid;
  let delete_id = new ObjId(req.body._id);
  mydb.collection('post').deleteOne({_id: delete_id})
  .then(result => {
    res.status(200).send()
  });
});

app.post("/edit", (req,res) => {
  console.log(req.body.title);
  console.log(req.body.content);
  let new_id = new ObjId(req.body.id);
  mydb.collection('post').updateOne( {_id : new_id},
    {$set :{title : req.body.title, content : req.body.content}}
    ).then (result => {
      console.log('데이터 수정 성공');
      res.redirect('/list/' + req.session.user.userid);
    });
});

app.post("/savepost", (req,res) => {
  let now = new Date();
  console.log('세션 입니다.' + req.session.user);
  mydb.collection('post').insertOne(
    {userid : req.session.user.userid, Username : req.session.user.Username , title : req.body.title, content : req.body.content, date : now.getTime(), path : imagepath , type : imageType } 
    ).then (result => {
      console.log('데이터 추가 성공');
      res.redirect('/list/' + req.session.user.userid);
    });
});

app.post('/photo', upload.single('picture'), function(req,res){
  withoutPublic = path.relative('public', req.file.path);
  imagepath = '\\' + withoutPublic;                               //이미지 경로 저장
  imageType = req.file.mimetype;                                  //이미지 타입 저장
})

app.post('/saveNeighbor', (req,res) => {
  mydb.collection('account').updateOne({userid : req.body.loginid},
  {$push : {neighbor : req.body.postname, neighborId : req.body.postid}}
  ).then(result => {
    req.session.user.neighbor.push(req.body.postname);
    req.session.user.neighborId.push(req.body.postid);
    res.status(200).send();
  })
})

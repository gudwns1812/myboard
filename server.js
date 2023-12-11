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

//회원가입
app.post("/save", (req,res) => { 
  let now = new Date();   //날짜 객체 생성하여 현재 날짜를 저장

  //계정 게시물에 새로운 데이터 삽입
  mydb.collection('account').insertOne(
    {Firstname : req.body.Firstname, Lastname : req.body.Lastname, Username : req.body.Username , userid : req.body.userid, userpw : sha(req.body.userpw), Sex : req.body.Sex ,date : now.getTime() , neighbor : [] , neighborId : [] } 
    ).then (result => {
      console.log('데이터 추가 성공');
      res.redirect('/');
    });
});

//로그인
app.post("/login" , (req,res) => {
  console.log(req.body.id);
  let post;
  //계정 db에 내가 찾으려는 id가 있는지 확인
  mydb.collection('account').findOne({ userid : req.body.userid }
    ).then( result => {
      //id가 없다면
      if (result == null) {
        res.render('login.ejs');
      }else{
        //비밀번호도 맞는지 확인
        if (result.userpw == sha(req.body.userpw)) {
          //비밀번호도 맞다면 계정의 이웃의 게시물들을 찾아서 메인화면에 띄우기
          mydb.collection('post').find({userid : { $in: result.neighborId }}).sort({date : -1}).toArray()
          .then( (neighbor) =>{
            post = neighbor;
          })
          //세션에 유저 넣어주기
          req.session.user = result;
          res.render('index.ejs', {user: req.session.user , post : post});
        }else{
          //비밀번호가 틀리다면 login페이지
          res.render('login.ejs');
        }
      }
    })
})

//게시물 삭제
app.post("/delete", (req,res) => {
  //_id를 새로운 objectid 객체로 만든다.
  let delete_id = new ObjId(req.body._id);
  //새로운 objectid와 같은 _id를 찾아서 삭제한다.
  mydb.collection('post').deleteOne({_id: delete_id})
  .then(result => {
    res.status(200).send()
  });
});

//게시물 수정
app.post("/edit", (req,res) => {
  //_id를 새로운 objectid 객체로 만든다.
  let new_id = new ObjId(req.body.id);
    //새로운 objectid와 같은 _id를 찾아서 변경한다.
  mydb.collection('post').updateOne( {_id : new_id},
    {$set :{title : req.body.title, content : req.body.content}}
    ).then (result => {
      console.log('데이터 수정 성공');
      //데이터를 수정했다면 원래 목록으로 돌아간다.
      res.redirect('/list/' + req.session.user.userid);
    });
});

//게시물 저장
app.post("/savepost", (req,res) => {
  //날짜 객체 생성하여 현재 날짜를 저장
  let now = new Date();
  //post db에 새로운 게시물 삽입
  mydb.collection('post').insertOne(
    {userid : req.session.user.userid, Username : req.session.user.Username , title : req.body.title, content : req.body.content, date : now.getTime(), path : imagepath , type : imageType } 
    ).then (result => {
      console.log('데이터 추가 성공');
      res.redirect('/list/' + req.session.user.userid);
    });
});

//첨부 파일 저장
app.post('/photo', upload.single('picture'), function(req,res){
  withoutPublic = path.relative('public', req.file.path);
  imagepath = '\\' + withoutPublic;                               //이미지 경로 저장
  imageType = req.file.mimetype;                                  //이미지 타입 저장
})

//이웃추가
app.post('/saveNeighbor', (req,res) => {
  //account db에서 userid가 로그인한 유저인 데이터를 찾기
  mydb.collection('account').updateOne({userid : req.body.loginid},
  //이웃 닉네임과 id배열에 각각 추가
  {$push : {neighbor : req.body.postname, neighborId : req.body.postid}}
  ).then(result => {
    //세션 업데이트
    req.session.user.neighbor.push(req.body.postname);
    req.session.user.neighborId.push(req.body.postid);
    res.status(200).send();
  })
})
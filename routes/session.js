const { render } = require('ejs');
const express = require('express');
const router = express.Router();
let session = require('express-session');
const mongoclient = require("mongodb").MongoClient;

const url ='mongodb+srv://gudwns1812:gudwns10113@cluster0.dkvhb8p.mongodb.net/?retryWrites=true&w=majority' ;
const sha = require('sha256');
const ObjId = require('mongodb').ObjectId;
let mydb;
mongoclient.connect(url)
.then(result => {
    mydb = result.db('myboard');
})
router.use(express.static('public'));
router.use(session({
    secret : 'ask12291ja',
    resave : false,
    saveUninitialized: true,
}));
router.get('/', (req,res) => {
    res.render('index.ejs', {user : req.session.user});
})

router.get('/login', (req, res) => {
	console.log(req.session);
	if (req.session.user) {
        mydb.collection('account').findOne({userid : req.session.user.userid})
        .then(result => {
            mydb.collection('post').find({userid : { $in: result.neighborId }}).toArray()
            .then( (neighbor) =>{
              res.render('index.ejs', {user: req.session.user, post : neighbor});
            })
        })
	}else{
		res.render('login.ejs');
	}
});
router.get('/logout', (req,res) => {
    req.session.destroy();
    res.render('index.ejs', {user:null});
})

router.get('/list/:id', (req,res) => {
    if (req.params.id == 'postcss.css') {                           //post.css를 제외하기위한 제어문
        res.status(404).send('Not Found');
        return;
    }
    let userid = req.params.id;
    let Auth = false;                                               //사용자와 postid가 같은지 확인하기 위한 변수
    let user;
    mydb.collection('account').findOne({userid : userid})
    .then(result => {
        user = result;
        mydb.collection('post').find({userid : userid}).toArray()      //먼저 userid에 해당하는 포스트를 전부 가져와서 배열로 만든다.
        .then((result) => {
            let data = result[0];                                      //기본값은 포스트중에서 제일 처음 포스트
            if (req.session.user.userid == userid){                    //사용자와 postid가 같으면
                Auth = true;                                           //권한 부여
            }
            res.render('list.ejs',{data : data , total : result, Auth : Auth, user : user, LoginUser : req.session.user});
        })
    })
})
router.get('/list/:id/:postId', (req, res) => {
    let userid = req.params.id;
    let Auth = false;                                               //사용자와 postid가 같은지 확인하기 위한 변수
    let new_id;
    let user;
    mydb.collection('account').findOne({userid : userid})
    .then(resultuser => {
        user = resultuser;
        console.log(req.session.user);
        mydb.collection('post').find({userid : userid}).toArray()      //먼저 userid에 해당하는 포스트를 전부 가져와서 배열로 만든다.
        .then((result) => {
            if (req.params.postId.length == 24) {                      //postid가 objectid일 경우
                new_id = new ObjId(req.params.postId);
            }
            else if (!req.params.postId) {                             
                if (result == null) {                                  //post가 비어있을 경우
                    new_id = null;
                }else{                                                 //postid가 없을 경우 기본값으로 설정하여 post제일 처음것을 리스트에 보여지도록 한다.
                    new_id = result[0].userid;
                }
            }else{
                new_id = null;
            }
            let total = result;                                         //결과를 total에 저장
            mydb.collection('post').findOne({_id : new_id})
            .then((result) => {
                if (userid == req.session.user.userid) {                //사용자와 postid가 같으면
                    Auth = true;                                        //권한 부여
                }
                res.render('list.ejs', {data : result , total : total, Auth : Auth, user : user, LoginUser : req.session.user});
            }).catch(err => {
                res.status(500).send();
            });
        })
    })
});

router.get('/Allpost' , (req,res) => {
    mydb.collection('post').find().toArray()
    .then(result => {
        res.render('Allpost.ejs', {user : req.session.user , post : result})
    })
})
module.exports = router;
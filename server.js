const mysql = require("mysql2");
const express = require("express");
const bodyParser = require("body-parser");
const session = require('express-session')
const expressHbs = require("express-handlebars");

const app = express()
app.use(express.json())
app.use(express.urlencoded({extended:false}))

app.use(session({
	secret: 'secret',
	resave: true,
	saveUninitialized: true
}));
app.use(bodyParser.urlencoded({ extended: false }));



const pool = mysql.createPool({
  
  host: "localhost",
  user: "root",
  database: "usres",
  password: ""
});
 
app.set("view engine", "hbs");
 
//  рендер головної сторінки
app.get("/", function(req, res){
   console.log(req.session.email)
  if(!req.session.email)
      {res.render("index.hbs");}
      else{res.render("autind.hbs")}
    });
    // рендер мапи
    app.get("/map", function(req, res){
      pool.query("SELECT * FROM events", function(err, data) {
        res.render("map.hbs", {
            allUsers: data
        });
      })
    });

    
var user,events,id
//рендер профілю
    app.get("/profile", function(req, res){
     
      pool.query('SELECT * FROM users WHERE email = ? ', [req.session.email], function(error, results, fields) {
       user=results;
       console.log(user.description)
       
    
        res.render("profile.hbs",{
          user:user,
     
          
          });
      
       
      })
     
    });
    app.get("/logout", function(req, res){
   req.session.email=undefined
      res.redirect("/");
    });
// возвращаем форму для добавления данных
app.get("/create", function(req, res){
    pool.query("SELECT * FROM users", function(err, data) {
        if(err) return console.log(err);
        res.render("create.hbs", {
            users: data
        });
      });
    
});
// рендер форми для створення події
app.get("/crevent", function(req, res){

pool.query("SELECT * FROM users WHERE email=? ", [req.session.email], function(err, data) {
      res.render("crevent.hbs", {
          user: data
      });
    })
  
});
// вивід подій
app.get("/events", function(req, res){

  pool.query("SELECT * FROM events ", function(err, data) {
        res.render("events.hbs", {
            events: data
        });
      })
    
  });
// отримання списку подій  користувача
app.post("/myevents", function(req, res){
const id = req.body.id;
console.log(id)
    pool.query("SELECT * FROM events WHERE id=? ", [req.body.id], function(err, data) {
      res.render("myevents.hbs", {
          events: data
      });
    })

    
  });
// пост метод додавання події
app.post("/crevent",  function (req, res) {

        const name = req.body.name;
     const user = req.body.id
        const adress = req.body.adress;
        const lat = req.body.lat;
        const lng = req.body.lng;
        const tag = req.body.tag;
        const description = req.body.description
    
 
          pool.query("INSERT INTO events (name, user,lat,lng,tag,description) VALUES (?,?,?,?,?,?)", [name, parseInt(user),lat,lng,tag,description], function(err, data) {
              if(err) return console.log(err);
              console.log(req.session.email)
              res.redirect("/")
           
          })      
        
 
});

// получаем отправленные данные и добавляем их в БД 
app.post("/create",  function (req, res) {
  const o = req.body.email
  pool.query("SELECT COUNT(*) AS cnt FROM users WHERE email = ? " , 
[o] , function(err , data){
   if(err){
       console.log(err);
   }   
   else{
       if(data[0].cnt > 0){  
             res.redirect('/create')
            
       }else{
        const name = req.body.name;
        const age = req.body.age;
        const email = req.body.email;
        const password = req.body.password;
        const interes = req.body.interes;
        const description = req.body.description
          pool.query("INSERT INTO users (name, age,email,password,interes,description) VALUES (?,?,?,?,?,?)", [name, age,email,password,interes,description], function(err, data) {
              if(err) return console.log(err);
              res.redirect("/")
             ;
            });         
       }
   }
})
});
// получение списка пользователей
app.get("/users", function(req, res){
  pool.query("SELECT * FROM users", function(err, data) {
      if(err) return console.log(err);
      res.render("users.hbs", {
          users: data
      });
    });
  
});
app.post("/delete/:id", function(req, res){
          
  const id = req.params.id;
  pool.query("DELETE FROM users WHERE id=?", [id], function(err, data) {
    if(err) return console.log(err);
    res.redirect("/");
  });
});
// пост метод оновлення інформації користувача
app.post("/profile",  function (req, res) {
  const name = req.body.name;
  const age = req.body.age;
  const email = req.body.email;
  const password = req.body.password
  const interes = req.body.interes
  const description = req.body.description
  pool.query("UPDATE users SET name=?, age=?,email=?,password=?,interes=?,description=? WHERE email=?", [name, age,email,password,interes,description, email], function(err, data) {
    if(err) return console.log(err);
    console.log(description)
      res.redirect("/");
  });
});
// рендер форми для зареєстрованиї користувачів
app.get("/autusers", function(req, res){
  pool.query("SELECT * FROM users", function(err, data) {
      if(err) return console.log(err);
      res.render("autusers.hbs", {
          users: data
      });
    });
  
});
// рендер форми логіну
app.get('/login', function(request, response) {
	response.render('login.hbs');
});
// аутентифікація
app.post('/auth', function(request, response) {
	var email = request.body.email;
	var password = request.body.password;
	if (email && password) {
		pool.query('SELECT * FROM users WHERE email = ? AND password = ?', [email, password], function(error, results, fields) {
			if (results.length > 0) {
				request.session.loggedin = true;
				request.session.email = email;
        response.redirect('/profile');
        console.log(request.session.email)
			} else {
				response.send('Incorrect email and/or Password!');
			}			
			response.end();
		});
	} else {
		response.send('Please enter email and Password!');
		response.end();
	}
});
















// получем id редактируемого пользователя, получаем его из бд и отправлям с формой редактирования
app.get("/edit/:id", function(req, res){
  const id = req.params.id;
  pool.query("SELECT * FROM users WHERE id=?", [id], function(err, data) {
    if(err) return console.log(err);
     res.render("edit.hbs", {
        user: data[0]
    });
  });
});
// получаем отредактированные данные и отправляем их в БД
app.post("/edit",  function (req, res) {
         
  if(!req.body) return res.sendStatus(400);
  const name = req.body.name;
  const age = req.body.age;
  const id = req.body.id;
   
  pool.query("UPDATE users SET name=?, age=? WHERE id=?", [name, age, id], function(err, data) {
    if(err) return console.log(err);
    res.redirect("/");
  });
});
 

// получаем id удаляемого пользователя и удаляем его из бд
app.post("/delete/:id", function(req, res){
          
  const id = req.params.id;
  pool.query("DELETE FROM users WHERE id=?", [id], function(err, data) {
    if(err) return console.log(err);
    res.redirect("/");
  });
});


 
app.listen(3000, function(){
});
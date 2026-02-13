import express from 'express'
import dotenv from 'dotenv'
import mysql from 'mysql'
import bp from 'body-parser'
import bycryptjs from 'bcryptjs'
import jwt from 'jsonwebtoken'


dotenv.config()

const app = express()
app.use(bp.json())

// db mysql connection 
const mydb = mysql.createConnection({
    host:process.env.HOST,
    user: process.env.USER,
    password:process.env.PASSWORD,
    database: process.env.DATABASE
})

mydb.connect(function(err){
    if(err) throw new Error(err)
        console.log('Mysql Databse connected')
})

app.get("/", (req, res) => {
  res.send("Server is working!");
});

// app.get('/',function(req,res){
//     try {
//     res.status(200).send('my Server is running')
        
//     } catch (error) {
//         res.status(500).send('Internal Server errror')
//     }
// })

// authentication
// REGISTER creating user for first time 
app.post('/register',function(req,res){
    const {username,email,password} = req.body;
    // check if user is already in db
    mydb.query('SELECT * FROM users WHERE email = ?',[email],
        async(err,result)=>{
            if(result.length >0){
                return res.status(500).json({message: 'User already exits'})
            }

            // hash the password
            const newpassword = await bycryptjs.hash(password,10)
            // save the user in db
            mydb.query(
                "INSERT INTO users(username,email,password) VALUES (?,?,?) ",
                [username,email,newpassword],err=>{
                    if(err) throw new Error(err)
                        res.status(201).json({message: 'User created successfully',result})
                })
        }

    )
})
//LOGIN checking created user

app.post('/login', function(req,res){
    //check if user is in db
    const {email,password} = req.body;
    // find the user in db
    mydb.query("SELECT * FROM users WHERE email=?",[email], async(err,results)=>{
        if(err) throw new Error(err)
        if(results.length === 0) return res.status(404).json({message: 'User not found'})
            //get user
        const user = results[0]
        console.log(user)
        // compare the password
        const matchedPassword = await bycryptjs.compare(password,user.password)
        console.log(matchedPassword)
        if(!matchedPassword) {
            return res.status(401).json({message: 'Invalid credentials'})
        }
        // generate a token
        const token = jwt.sign(
            {id: user.id, email: user.email},
            process.env.JWT_SECRET,
            {expiresIn: '1h'}
        )
        res.status(200).json({message: 'Login successful', token})
    })
})


// middleware to verify token
const verifyToken =(req,res,next)=>{
    const authHeader = req.headers['authorization']
    if(!authHeader) return res.status(401).json({message: 'No token provided'})

    const token = authHeader.split(' ')[1]
    if(!token) return res.status(401).json({message: 'No token provided'})

    jwt.verify(token, process.env.JWT_SECRET,(err,decoded)=>{
        if(err) return res.status(401).json({message: 'Invalid token'})
        req.user = decoded//attach our user to a request
    next()//execute our real API function after these checks//allow request
    })
}


// GET all users(students)

app.get('/users',function(req,res){
    mydb.query('select * from users',(err,results)=>{
        if(err) throw new Error(err)
        res.json({message: 'Got users ',results})
    })
})

// app.post('/users',function(req,res){
//     const {id,name,age,salary,isActive} = req.body
//     mydb.query('insert into users (id,name,age,salary,isActive) values(?,?,?,?,?)',[id,name,age,salary,isActive],(err,results)=>{
//         if(err) throw new Error(err)
//         res.json({message: 'Added a user',results})
//     })
// })


app.get('/users/:id', function(req,res){
    const id = req.params.id
    mydb.query('select * from users where id = ?',[id],(error,results)=>{
          if(error) throw new Error(error)
        res.json({message: 'Added a user',results})
    })
})

app.put('/users/:id',verifyToken, function(req,res){
    const id = req.params.id;
        const {email,username} = req.body
    mydb.query('UPDATE users SET username=?, email=? WHERE id =?'
        ,[username,email,id],(err,results)=>{
             if(err) throw new Error(err)
        res.json({message: 'updated a user',results})
        })
})


// app.delete

app.delete('/users/:id',verifyToken,   function(req,res){
    const id = req.params.id
    mydb.query('DELETE from  users where id= ?',[id],(err,results)=>{
        if(err) throw new Error(err)
                    res.json({message: 'deleted a user',results})

    })
})


app.listen(process.env.PORT, function(){
    console.log('server is running on port 5000')
})





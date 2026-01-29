import express from 'express'
import dotenv from 'dotenv'
import mysql from 'mysql'
import bp from 'body-parser'

dotenv.config()

const app = express()
app.use(bp.json())

// db mysql connection 
const mydb = mysql.createConnection({
    host:'localhost',
    user: 'root',
    password:'',
    database: 'StudentManagement'
})

mydb.connect(function(err){
    if(err) throw new Error(err)
        console.log('Mysql Databse connected')
})


app.get('/',function(req,res){
    res.send('my Server is running')
})

// GET all users(students)

app.get('/users',function(req,res){

    mydb.query('select * from users',(err,results)=>{
        if(err) throw new Error(err)
        res.json({message: 'Got users ',results})
    })
})

app.post('/users',function(req,res){
    const {id,name,age,salary,isActive} = req.body
    mydb.query('insert into users (id,name,age,salary,isActive) values(?,?,?,?,?)',[id,name,age,salary,isActive],(err,results)=>{
        if(err) throw new Error(err)
        res.json({message: 'Added a user',results})
    })
})



app.listen(5000, function(){
    console.log('server is running on port 5000')
})
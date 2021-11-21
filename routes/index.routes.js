const router = require("express").Router();
const bcrypt = require("bcrypt")
const User = require("../models/User.model")
const Adopter = require("../models/Adopter.model")
const Shelter = require("../models/Shelter.model")


/* /signup sister routes */
router
    .route('/signup')
    .get( (req, res) => { res.render('signup') })
    .post( async (req, res) => {
        
        let error = null
        let isAdopter = false
        let isShelter = false
        let newUser = null
        let { username, email, password, role } = req.body
        
        try {

          if ( !username || !email || !password || !role ) {
              res.render('signup', { username, email, role, error: {type: "CREDENTIALS_ERROR", message: "All fields are required!" }})
          }
  
          const user = await User.findOne( { email } )
          if (user) res.render("signup", { username, email, role, error: { type: "USER_ERROR", message: "This user already exists!" }})
        
          const salt = bcrypt.genSaltSync(4)
          const hashedPwd = bcrypt.hashSync(password, salt)

          if (role === "adopter") {
            newUser = await Adopter.create({ username, email, role, password: hashedPwd })
            isAdopter = true
          } else if (role === "shelter") {
            newUser = await Shelter.create({ username, email, role, password: hashedPwd })
            isShelter = true
          }

        } catch (e) {
          error = { errType: "DB_ERR", message: e }
          
        } finally {
          
          if (newUser) res.render("users/profile", { loggedInUser: newUser, username, email, role, isAdopter, isShelter, message: "User created successfully!!" })
          else res.render("signup", { username, email, role, error: { type: "DB_ERROR", message: "Error in the DB" }})
          
        }
  })


/* GET index (login) sister routes */
router
    .route('/')
    .get((req, res ) => { res.render('index') })
    .post( async (req, res ) => {
      
      let loggedInUser = null
      let error = null
      let message = ""
      let isAdopter = false
      let isAdmin = false
      let isShelter = false

      try {

        const {email, password} = req.body 
        if (!email || !password) res.render('index', { error: {type: "CREDENTIALS_ERROR", message: "Wrong credentials!" }})
            
        loggedInUser = await User.findOne( { email } )
        if (!loggedInUser) res.render('index', { error: {type: "USER_ERROR", message: "User doesn't exists!" }})
    
        let isPwdCorrect = bcrypt.compareSync(password, loggedInUser.password)
        
        if (isPwdCorrect) {
          //req.session.loggedInUser = loggedInUser
          message = "You are logged in!"

          switch(loggedInUser.role) { 
            case "adopter": isAdopter = true
              break;
            case "shelter": isShelter = true
              break;
            default: isAdmin = true
          }

        } else {
          message = "Password is incorrect!" 
          error = {type: "USER_ERROR", message }
        }

      } catch (e) {
          error = { errType: "DB_ERR", message: e }

      } finally {
          res.render("users/profile", { loggedInUser, user: loggedInUser, message, error, isAdopter, isAdmin, isShelter })
      }
    })


router.get('/logout', (req, res) => {
  req.session.destroy((err) => {
      if (err) res.redirect('/')
      else res.render('index', { message: "You are logged out!" })
  });
});


module.exports = router;

const router = require("express").Router();
const User = require("../models/User.model")
const Adopter = require("../models/Adopter.model")

// GET /users ==> list of users
router
    .route('/')
    .get( async (req, res) => { 

        let listUsers = []
        let error = null
        
        try {
            listUsers = await User.find()
        } catch (e) {
            error = { errType: "DB_ERR", message: e }
        } finally {
            res.render('users/list', { users: listUsers, error })
        }
    })

// GET and POST /users/profile/edit/:id (sister routes)     
router.get('/profile/edit/:role/:id', async (req, res) => { 
        
    let user = null
    let { id, role } = req.params

    try {

        user = await User.findById(id)
        if (!user) res.render('users/profile', { error: {type: "USER_ERROR", message: "User not found!" }})
        
        // Logged user can only edit their own profile (unless they are admin!)
        //if (loggedInUser.role === 'admin' || loggedInUser.id === req.params.id) {
            /// TO DO WHEN WE ARE HANDLING THE SESSIONS
        //}

    } catch (e) {
        error = { errType: "DB_ERR", message: e }

    } finally {

        switch(role) {
            case "adopter": res.render('adopters/edit-profile', { user })
                break;
            case "shelter": res.render('shelters/edit-profile', { user })
                break;
            default:        res.render('admin/control-panel', { user })
        }
    } 
})

// Different routes for each role for "POST Edit Profile" (because the response is very different)

// POST /profile/edit/adopter/:id
router.post('/profile/edit/adopter/:id', async (req, res) => { 
        
    let { fullname, children, animalPreference, housingSize } = req.body

    console.log(req.params.id)
    console.log("req.body",  req.body)

    if (!fullname) res.render('profile/edit/:id', { error: {type: "FORM_ERROR", message: "Fullname is required." }})
        
    Adopter.findById(req.params.id)
            .then( (user) => {
                console.log("user to update", user)
                if (!user) res.render(`profile/edit/adopter/${req.params.id}`, { error: {type: "DB_ERROR", message: "Error in the DB" }})
                Adopter.findByIdAndUpdate(req.params.id, 
                                         { fullname, children, animalPreference, housingSize}, 
                                         { new: true })
                        .then( (updatedUser) => {
                            console.log("updatedUser", updatedUser)
                            res.render('users/profile', { user: updatedUser, isAdopter: true, loggedInUser: updatedUser })
                        })
                        .catch( (e) => {
                            error = { errType: "DB_ERR", message: e }
                        })
            })
            .catch( (e) => {
                error = { errType: "DB_ERR", message: e }
            })     
    })


// GET /profile/:id
router.get('/profile/:id', async (req, res) => {
    let user = null
    let isAdopter = false
    let isShelter = false
    let isAdmin = false

    try {
        user = await User.findById(req.params.id)
        switch(loggedInUser.role) {
            case "adopter": isAdopter = true
              break;
            case "shelter": isShelter = true
              break;
            default: isAdmin = true
          }

    } catch (e) {
        error = { errType: "DB_ERR", message: e }
    } finally {
        res.render('/profile', {user, loggedInUser: user, isAdopter, isShelter, isAdmin})
    }

 })  


module.exports = router;

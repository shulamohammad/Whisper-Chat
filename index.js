// Import necessary modules
import express from 'express';
import bodyParser from 'body-parser';
// Create an instance of Express
const app = express();
const port = 3000;


// Set EJS as the view engine
app.set('view engine', 'ejs');

// Middleware to parse urlencoded request bodies
app.use(bodyParser.urlencoded({ extended: true }));
// Serve static files from the 'public' and 'uploads' directories
app.use(express.static('public'));
// Route for the home page
app.get('/', (req, res) => {
    res.render('home.ejs');
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});



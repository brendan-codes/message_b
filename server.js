// require and instanciate express
var express = require("express");
var app = express();

// require path and establish views folder and ejs
var path = require("path");
app.set('views', path.join(__dirname, './views'));
app.set('view engine', 'ejs');

// body parser  and url encoded, with an extra parameter that
// will hide a terminal error message you might get on nodemon server.js
var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended: false}));

// mongoose and connecting to our db
var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/adv_mongoose');

// this is where we establish a Schema variable. we'll use this
// inside of our associations so our models can read and understand what
// the ObjectId attribute is.
var Schema = mongoose.Schema;

// the comment schema, which contains the id of it's parent message.
// this is optional, as we can still do quite a bit without it, but
// if we ever have comments by themselves, it makes it a lot easier to find
// and attach it  back to the parent. also take note that we're only pulling the
// Schema.ObjectId and not Schema.Types.ObjectId. this is because we only need
// the id and not any other field with any other data type.
var commentSchema = new mongoose.Schema({
	_message: {type: Schema.ObjectId, ref: 'Message'},
	name: String,
	comment: String
});

// message schema, contains an ARRAY of comments. notice that we have an extra
// method call: '.Types'. this allows the comments array to contain full objects
// of all kinds of datatypes. basicly, it allows the entire object.
var messageSchema = new mongoose.Schema({
	name: String,
	message: String,
	comments: [{type: Schema.Types.ObjectId, ref: 'Comment' }]
});

// now that we've defined our schemas, we need to actually create the model and name
// it. this is done with mongoose.model, passing it both a collection name and
// a viable mongoose schema. At the same time, we store these models in variables
// so that they can be called elsewhere in our code.
var Message = mongoose.model('Message', messageSchema);
var Comment = mongoose.model('Comment', commentSchema);

// root route redirects to main.
app.get('/', function(req, res){
	res.redirect('/main');
});

// post route for new messages.
app.post('/message', function(req, res){
	console.log("POST DATA \n\n", req.body);
	var new_message = new Message({name: req.body.name, message: req.body.message});
	new_message.save(function(err){
		if(err) {
			console.log('error submitting to database');
			res.redirect('/');
		} else {
			console.log('successfully messaged a message');
			res.redirect('/');
		}
	})

})

// post route for new comments
app.post('/comment', function(req, res){
	// first we find the message the comment is for.
	Message.findOne({_id: req.body.id}, function(err, message){
		// create a new comment
		var comment = new Comment(req.body);
		// push the id of the parent message into the comment
		comment._message = message._id;
		// push the comment into the comments array of the message
		message.comments.push(comment);
		// save the comment first
		comment.save(function(err){
			// save the message second
			message.save(function(err){
				if(err){
					console.log('error adding comment, please contact your internet service provider');
					res.redirect('/');
				} else {
					console.log('successfully commented a comment');
					res.redirect('/');
				}
			})
		})
	})
})

// main get is what grabs all of our messages and comments, and renders the index
app.get('/main', function(req, res){
	// find all messages, populate the comments array, execute the query.
	// results of this query come in as a callback parameter called 'results'
	Message.find({}).populate('comments').exec(function(err, results){
		if(err) {
			console.log('error getting messages and comments');
			res.redirect('/');
		} else {
			console.log('successfully grabbed messages and comments');
			res.render('index', {messages: results});
		}
	})
})

// server listener
app.listen(8000, function() {
 console.log("listening on port 8000");
});

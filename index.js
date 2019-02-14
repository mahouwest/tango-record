var express    = require("express"), 
    bodyParser = require("body-parser"),
    word_version_count,
    word,
    fs         = require("fs")



try {
	word_version_count = require("./db/word_version.json");
	try {
		word = require("./db/word" + word_version_count.latest + ".json");
		console.log("單字本_v" + word_version_count.latest + "\n");
	} catch (e) {
		throw {ttt: "nf", message: e};
	}
} catch (e) {
	if(!e.ttt){
		console.log("找不到單字本版本紀錄文件，請自行建立一個，例如：");
		console.log("word_version.json: ");
		console.log("{ \"latest\": \"1\" }");
		throw e;
	} else {
		console.log("找不到當前版本的單字本資料(.json)");
		throw e.message;
	}
}


var app = express(),
    Router = express.Router({mergeParams: true})
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.use(bodyParser.urlencoded({extended: false}));

Router.get("/", (req, res) => {
	res.redirect("/tango");
});


// =======     =      =    =   ====    ====
//    =       = =     ==   =  =       =    =
//    =      =   =    = =  =  =  ==   =    =
//    =     =======   =  = =  =    =  =    =
//    =    =       =  =   ==   ====    ====

Router.get("/tango", (req, res) => {
	res.render("card", {words: word});
});

function saveWord(updatedTango){
	// update the lastest version, at most 5 versions in turn
	word_version_count.latest = ( (Number(word_version_count.latest) + 1) % 5 ).toString();
	// update words data
	fs.writeFile(__dirname + "/db/word" + word_version_count.latest + ".json", JSON.stringify(word, null, 4), (err) => {
		if(err){
			console.log(err);
		} else {
			// update word version information
			fs.writeFile(__dirname + "/db/word_version.json", JSON.stringify(word_version_count, null, 4), (err) => {
				if(err){
					console.log(err);
				} else {
					console.log("updated in word" + word_version_count.latest + ".json");
				}
			});
		}
	});

	fs.writeFile(__dirname + "/public/word_new.json", JSON.stringify(updatedTango, null, 4), (err) => {
		if(err) console.log(err);
	});
	return true;
}
function newTango(tag, tango){
	// check input not to be empty
	if( !(tango.write == "" && tango.pronounce == "" && tango.imi == "" && tango.level == "") ){
		// push new word
		if( !word.word[tag] ){
			console.log("沒有這個標籤...");
			return;
		} else {
			word.word[tag].push(tango);
		}
		console.log("[" + tag + "]" + JSON.stringify(tango, null, 2));
		saveWord(tango);
	} else {
		console.log("空氣單字???");
		return;
	}
}

Router.post("/tango/:tag/new", (req, res) => {
	// console.log(req.body);
	let newWord = {};
	for( var [key, value] of Object.entries(req.body) ){
		newWord[key] = value;
	}
	if(!newWord.write || newWord.write === "") newWord.write = "(air)";
	newTango(req.params.tag, newWord);
	res.send(newWord);
});

Router.get("/tango/:tag/:write/update", (req, res) => {
	var tango = {};
	let l = word.word[req.params.tag].length;
	for(let i = 0; i < l; i++){
		if(word.word[req.params.tag][i].write === req.params.write){
			tango = word.word[req.params.tag][i];
			break;
		}
	}
	res.render("card_update", {tag: req.params.tag, tango: tango});
});

Router.post("/tango/:tag/:write/update", (req, res) => {
	// looking up
	let l = word.word[req.params.tag].length;
	for(let i = 0; i < l; i++){
		if(word.word[req.params.tag][i].write === req.params.write){
			let tangoToUpdate = word.word[req.params.tag][i];
			// 三項更新走這
			if(!req.body.level){
				if(req.body.write === ""){
					tangoToUpdate.write = "(air)"
				} else {
					tangoToUpdate.write = req.body.write;
				}
				tangoToUpdate.pronounce = req.body.pronounce;
				tangoToUpdate.imi = req.body.imi;
			}
			// level更新走這
			else {
				// 檢查level屬性已設置
				if(tangoToUpdate["level"] === undefined){
					tangoToUpdate.level = 1;
				} else {
					if(req.body.level === "rise"){
						if(tangoToUpdate.level < 3){
							tangoToUpdate.level = Number(tangoToUpdate.level) + 1;
						}
					}
					else if(req.body.level === "fall"){
						if(tangoToUpdate.level > 0){
							tangoToUpdate.level = Number(tangoToUpdate.level) - 1;
						}
					}
				}
				
			}
			
			saveWord(tangoToUpdate);
			break;
		}
	}
	res.redirect("/tango");
});

Router.get("/tango/:tag/:write/delete", (req, res) => {
	let l = word.word[req.params.tag].length;
	let d;
	for(let i = 0; i < l; i++){
		// issue: "\" "\\"
		if(word.word[req.params.tag][i].write === req.params.write){
			console.log(`removed [${req.params.tag}]${JSON.stringify(word.word[req.params.tag][i], null, 2)}`);
			d = word.word[req.params.tag].splice(i, 1);
			saveWord({});
			break;
		}
	}
	res.send({delete: d});
});


// JSON API
Router.get("/tango/:tag", (req, res) => {
	fs.readFile(__dirname + `/db/word_${req.params.tag}.json`, {encoding: null}, (err, data) => {
		if(err){
			console.log("tag not found\n", err);
			res.end();
			return;
		}
		// Btyes Buffer(encoding = null) -> Json
		res.send(JSON.parse(data));
		console.log("send json");
	});
});



app.use(Router);

// port 80 is default for http, 443 for https
app.listen(80, "localhost", function(){
})

// Note Note Note Note Note Note Note Note Note Note
// fs.readfile(), Buffer.toString()
//jshint esversion:6

const express = require("express");
const date = require(__dirname + "/date.js");
const mongoose = require('mongoose');
const _ = require('lodash');
mongoose.set('strictQuery', false)
const app = express();

app.set('view engine', 'ejs');

app.use(express.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://bhavyab:bhavyabh@cluster0.z9imdtf.mongodb.net/todolistDB");

const itemsSchema = {
  name: String
};

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const Item = mongoose.model("Item", itemsSchema);
const List = mongoose.model("List", listSchema);

const item1 = new Item ({
  name: "Get up!"
});

const item2 = new Item ({
  name: "Make BF!"
});

const item3 = new Item ({
  name: "go now!"
});

const defaultItems = [item1, item2, item3];

app.get("/", function(req, res) {
  const day = date.getDate();
  Item.find({}, function(err, results) {

    if (results.length === 0) {
      Item.insertMany(defaultItems, function(err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Defaulted!");
        }
      });
      res.redirect("/");
    } else {
      res.render("list", {listTitle: "Today", newListItems: results});
    }
  });


});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const newItem = new Item({
    name: itemName
  });

  if (listName === "Today") {
    newItem.save();
    res.redirect("/");
  } else {
    List.findOne({name:listName}, function(err, result) {
      result.items.push(newItem);
      result.save();
      res.redirect("/" + listName);
    });
  }
});


app.post ("/delete", function(req, res) {
  const listName = req.body.listName;
  if (listName === "Today") {
    Item.findByIdAndRemove(req.body.cb, (err) => {
      if (err) {
        console.log(err);
      } else {
        console.log("Deleted");
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate(
      {name: listName},
      {$pull: {items: {_id: req.body.cb}}},
      function(err, results) {
        if (!err) {
          res.redirect("/" + listName);
        }
      });
  }
});

app.get("/:listName", function(req,res){
  const custom = _.capitalize(req.params.listName);
  List.findOne({name: custom}, function(err, result) {
    if (!err) {
      if (!result) {
        // Create new List
        const list = new List({
          name: custom,
          items: defaultItems
        });
        list.save();
        res.redirect("/" + custom);
      } else {
        // Show the existing list
        res.render("list", {listTitle: result.name, newListItems: result.items});
      }
    }
  });


});

app.get("/about", function(req, res){
  res.render("about");
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function() {
  console.log("Server started on port " + port);
});

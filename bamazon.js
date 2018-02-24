//Setup Required Variables
var Table = require('cli-table');
var mysql = require('mysql');
var inquirer = require('inquirer');
//Connect to SQL database
var connection = mysql.createConnection({
    host: "localhost",
    port: 3306,
    user: "root",  
    password: "",
    database: "bamazon_db"
});
//establish connection with database
connection.connect(function(err) {
    if (err) throw err;
    console.log("connected as id " + connection.threadId);
    startPrompt();
});

//Introduction

function startPrompt() {

    inquirer.prompt([{

        type: "confirm",
        name: "confirm",
        message: "Good Morning, Good Afternoon, or Goodnight! Welcome to Bamazon! Would you like to take a peak at our inventory?",
        default: true

    }]).then(function (user) {
        if (user.confirm === true) {
            inventory();
        } else {
            console.log("Maybe Next Time! We will see you soon!");
        }
    });
}

//Inventory

function inventory() {

    var table = new Table({
        head: ['ID', 'Item', 'Department', 'Price', 'Stock'],
        colWidths: [10, 30, 30, 30, 30]
    });

    listInventory();

    function listInventory() {

        //Variable creation from connection with Database

        connection.query("SELECT * FROM products", function (err, res) {
            for (var i = 0; i < res.length; i++) {

                var itemId = res[i].item_id,
                    productName = res[i].product_name,
                    departmentName = res[i].department_name,
                    price = res[i].price,
                    stockQuantity = res[i].stock_quantity;

                table.push(
                    [itemId, productName, departmentName, price, stockQuantity]
                );
            }
            console.log("");
            console.log("====================================================== Current Inventory ======================================================");
            console.log("");
            console.log(table.toString());
            console.log("");
            continuePrompt();
        });
    }
}

//=================================Inquirer user purchase===============================

function continuePrompt() {

    inquirer.prompt([{

        type: "confirm",
        name: "continue",
        message: "Would you like to purchase an item?",
        default: true

    }]).then(function (user) {
        if (user.continue === true) {
            selectionPrompt();
        } else {
            console.log("Thanks so much! Come back soon!");
        }
    });
}

//=================================Item selection and Quantity desired===============================

function selectionPrompt() {

    inquirer.prompt([{

        type: "input",
        name: "inputId",
        message: "Please enter the ID number of the item you would like to purchase.",
    },
    {
        type: "input",
        name: "inputNumber",
        message: "How many units of this item would you like to purchase?",

    }
    ]).then(function (userPurchase) {

        //connect to database to find stock_quantity in database. If user quantity input is greater than stock, decline purchase.

        connection.query("SELECT * FROM products WHERE item_id=?", userPurchase.inputId, function (err, res) {
            for (var i = 0; i < res.length; i++) {

                if (userPurchase.inputNumber > res[i].stock_quantity) {

                    console.log("===================================================");
                    console.log("Oh no! Not enough in stock. Please try again later.");
                    console.log("===================================================");
                    startPrompt();

                } else {
                    //list item information for user for confirm prompt
                    console.log("===================================");
                    console.log("Good News! We can fulfill your order.");
                    console.log("===================================");
                    console.log("You've selected:");
                    console.log("----------------");
                    console.log("Item: " + res[i].product_name);
                    console.log("Department: " + res[i].department_name);
                    console.log("Price: " + "$" + res[i].price);
                    console.log("Quantity: " + userPurchase.inputNumber);
                    console.log("----------------");
                    console.log("Total: " + "$" + res[i].price * userPurchase.inputNumber);
                    console.log("===================================");

                    var newStock = (res[i].stock_quantity - userPurchase.inputNumber);
                    var purchaseId = (userPurchase.inputId);
                    //console.log(newStock);
                    confirmPrompt(newStock, purchaseId);
                }
            }
        });
    });
}

//=================================Confirm Purchase===============================

function confirmPrompt(newStock, purchaseId) {

    inquirer.prompt([{

        type: "confirm",
        name: "confirmPurchase",
        message: "Are you sure you would like to purchase this item and quantity?",
        default: true

    }]).then(function (userConfirm) {
        if (userConfirm.confirmPurchase === true) {

            //if user confirms purchase, update mysql database with new stock quantity by subtracting user quantity purchased.

            connection.query("UPDATE products SET ? WHERE ?", [{
                stock_quantity: newStock
            }, {
                item_id: purchaseId
            }], function (err, res) { });

            console.log("=================================");
            console.log("Transaction completed. Thank you.");
            console.log("=================================");
            startPrompt();
        } else {
            console.log("=================================");
            console.log("No worries. Maybe next time!");
            console.log("=================================");
            startPrompt();
        }
    });
}

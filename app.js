var http = require('http'), //Create an http object and load the http.js module
    fs = require('fs'),
    url = require('url');
var p = require('path');
var qs = require('querystring');
var mysql = require('mysql');
var root = __dirname;
var headers = [         //String headers of the cart
    "Product Name", "Price", "Picture", "Buy Button"
];


var db = mysql.createConnection({   //Information to connect to local database.
    host:     'localhost',
    user:     'root',
    password: 'root',
    database: 'shop'
});
var cart = [];
var theuser=null;
var theuserid =null;
var server = http.createServer(function (request, response) { //New instance of the http.Server
    var path = url.parse(request.url).pathname; //Path in the actual HTTP request.
    var url1 = url.parse(request.url);          //Url in the actual HTTP request.
    if (request.method == 'POST') {
        switch (path) {
            case "/add":                        //If the action in the form is /add (Add an item to the cart)
                var body = '';
                console.log("add ");
                request.on('data', function (data) {    //Concatenate data chunk onto the buffer
                    body += data;
                });

                request.on('end', function () {         //Manipulate the data obtained in the request
                    var obj = qs.parse(body);
                    var id = parseInt(obj.prodid);
                    var quantity = parseInt(obj.qty);
                    console.log('addToCart id '+id)
                    var max =0;
                    var ind =0;
                    for (ind=0;ind<cart.length;ind++)   //Assign to the product added to the cart the actual biggest id + 1
                        if (max < cart[ind].cartid)
                            max = cart[ind].cartid;
                    var cartid = max+1;
                    //Query to Select the product with id of the product added
                    var query = "SELECT * FROM products where productID="+id;


                    db.query(   //Executes the above query
                        query,
                        [],
                        function(err, rows) {
                            if (err) {      //If there is an error filling the fields, throw an error
                                response.end(JSON.stringify(cart));
                                throw err;
                            }
                            console.log(JSON.stringify(rows, null, 2));
                            response.end(JSON.stringify(rows));

                            //If the product exist on the cart, increment its quantity with the quantity written in the field.
                            var exist = false;
                            for (i = 0; i<cart.length; i++){    //
                                if (cart[i].productid  == rows[0].productID){
                                    cart[i].quantity = cart[i].quantity + quantity;
                                    exist = true;

                                    break;}
                            }
                            //If the product does not exist on the cart, add it
                            if (!exist){
                                query =
                                cart.push({
                                        "cartid": cartid,
                                        "productid": rows[0].productID,
                                        "name": rows[0].name,
                                        "price": rows[0].price,
                                        "image": rows[0].image,
                                        "quantity": quantity
                                    }
                                );

                            }

                            console.log(cart);
                            response.writeHead(200, {
                                'Access-Control-Allow-Origin': '*'
                            });
                            response.end(JSON.stringify(cart));
                        }
                    );


                });

                break;
            case "/newProduct":     //If the action in the form is /newProduct (Create a new product)
                var body = '';
                console.log("add ");
                request.on('data', function (data) {    //Concatenate data chunk onto the buffer
                    body += data;
                });

                request.on('end', function () {         //Manipulate the data obtained in the request
                    var product = qs.parse(body);

                    console.log('new Product');
                    console.log(JSON.stringify(product, null, 2));

                    var query = "INSERT INTO products (name, quantity, price, image)" +
                        " VALUES (?,?,?,?)";            //Query to Insert the new product in the database with the data of the form
                    var data = [product.name, product.quantity, product.price, product.image]; //Data to insert in the products table
                    db.query(                           //Executes the query with the values of the data
                        query, data,
                        function (err) {
                            if (err) {              //If there is an error filling the fields, throw an error
                                response.end("error");
                                throw err;
                            }
                            response.end("Product added successfully"); //If product was added successfully

                        }
                    );
                });
                break;

            case "/delete":         //If the action in the form is /delete (Delete a product from the cart)
                var body = '';
                console.log("delete ");
                request.on('data', function (data) {    //Concatenate data chunk onto the buffer
                    body += data;
                });

                request.on('end', function () {         //Manipulate the data obtained in the request
                    var post = qs.parse(body);
                    var cartid = parseInt(post['cnt']); //CartID that you want to delete

                    var index = 0;
                    for (index = 0; index < cart.length; index++) //Delete the product with the index that has the same cartID of the one that you want to delete.
                        if (cart[index].cartid == cartid) {
                            cart.splice(index, 1);
                            console.log("deleted");
                        }

                    response.writeHead(200, {
                        'Access-Control-Allow-Origin': '*'
                    });
                    response.end(JSON.stringify(cart));
                });


                break;
            case "/userLogin":      //If the action in the form is /userLogin (Login of an user)
                var body = '';
                console.log("user Login ");
                request.on('data', function (data) {      //Concatenate data chunk onto the buffer
                    body += data;
                });

                request.on('end', function () {           //Manipulate the data obtained in the request
                    var obj = qs.parse(body);
                    console.log(JSON.stringify(obj, null, 2));
                    var query = "SELECT * FROM Customer where name='"+obj.name+"'"; //Query to Select the customer where the name is the name of the customer login
                    response.writeHead(200, {
                        'Access-Control-Allow-Origin': '*'
                    });

                    db.query(               //Executes the above query
                        query,
                        [],
                        function(err, rows) {
                            if (err) {      //If there is an error filling the fields, throw an error
                                response.end("error");
                                throw err;
                            }
                            if (rows!=null && rows.length>0) {   //If the user is in the database and fields are not blank, perform the login
                                console.log(" user in database");
                                response.end(" logged on as "+obj.name);
                                theuser = obj.name;
                                theuserid = rows[0].customerID;
                            }
                            else{   //If the user is not registered in the database, end response
                                console.log(" user not in database");
                                response.end(" user not in database");
                            }

                        }
                    );


                });


                break;
            case "/checkout":   //If the action in the form is /checkout (Process payment)
                var body = '';
                console.log("checkout ");
                request.on('data', function (data) {    //Concatenate data chunk onto the buffer
                    body += data;
                });

                request.on('end', function () {         //Manipulate the data obtained in the request
                    var obj = qs.parse(body);
                    console.log(JSON.stringify(obj, null, 2));
                    response.writeHead(200, {
                        'Access-Control-Allow-Origin': '*'
                    });
                    var ret = {error:1,
                        message: "please logon"};
                    if (theuserid==null) {
                        response.end("please logon");   //If the user is not registered (In the database), error
                        return;
                    }
                    var query = "INSERT INTO Orders (customerID, saledate) "+ //Query to insert the order in the Orders Table
                        "VALUES (?, ?)";                                      //The values to insert are the customerID and the current Date.
                    var d = new Date();
                    var data = [theuserid,""+d];
                    db.query(                                                 //Executes the above query
                        query,
                        data,
                        function(err, result) {
                            if (err) {                                        //If there is an error, throw an error
                                console.log("error in insert");
                                ret.message = "error in database";
                                response.end(JSON.stringify(ret));
                                throw err;
                            }
                            theuser = obj.name;                               //If there is no error continue.
                            console.log("orders added");
                            var index =0;
                            data =[];
                            query = "INSERT INTO OrderDetails (orderID, productID, quantity)"+  //Insert in the table OrderDetails every productID and quantity of the given orderID
                                " VALUES ";
                            for (index=0;index<cart.length;index++){
                                if (index !=0)
                                    query+=',';
                                query += " (?,?,?)";
                                data.push(result.insertId);
                                data.push(cart[index].productid);
                                data.push(cart[index].quantity);
                            }
                            console.log(data);
                            console.log(query);
                            db.query(                                   //Executes the above query
                                query,
                                data,
                                function(err, result) {                 //If there is an error, throw an error
                                    if (err) {
                                        response.end("error");
                                        throw err;
                                    }
                                    console.log("orderdetails added");  //If there is not an error, end the response
                                    ret.message = "order added";
                                    ret.error =0;
                                    response.end("order added");

                                }
                            );


                        }
                    );


                });


                break;
            case "/userRegister":           //If the action in the form is /userRegister (Register an User)
                var body = '';
                console.log("user Register ");
                request.on('data', function (data) {    //Concatenate data chunk onto the buffer
                    body += data;
                });

                request.on('end', function () {         //Manipulate the data obtained in the request
                    var obj = qs.parse(body);
                    console.log(JSON.stringify(obj, null, 2));
                    var query = "SELECT * FROM Customer where name='"+obj.name+"'"; //Query to select the user with the name of the Customer registered
                    response.writeHead(200, {
                        'Access-Control-Allow-Origin': '*'
                    });

                    db.query(                                   //Executes the above query
                        query,
                        [],
                        function(err, rows) {
                            if (err) {                          //If there is an error filling the fields, throw an error
                                response.end("error");
                                throw err;
                            }
                            if (rows!=null && rows.length>0) { //If the name of the user is already in database, end the response
                                console.log(" user already in database");
                                response.end(" User "+obj.name+ " already in database");
                            }
                            else{                               //If the name of the user is not in the database
                                query = "INSERT INTO Customer (name, password, address)"+
                                        "VALUES(?, ?, ?)";      //Insert the name, password and address of the new Customer in the Customer table.
                                db.query(                       //Executes the above query with the data obtained from the fields
                                    query,
                                    [obj.name,obj.password,obj.address],
                                    function(err, result) {     //If there is an error filling the fields, throw an error
                                        if (err) {
                                            response.end("error");
                                            throw err;
                                        }                       //Else, login with the user registered.
                                        theuser = obj.name;
                                        theuserid = result.insertId;
                                        response.end(" logged on as "+obj.name);


                                    }
                                );
                            }

                        }
                    );


                });


                break;
        } //switch
    }
    else {
        switch (path) {

            case "/getCart":        //If the action is /getCart
                console.log("getCart");
                response.writeHead(200, {
                    'Content-Type': 'text/html',
                    'Access-Control-Allow-Origin': '*'
                });

                console.log(JSON.stringify(cart, null, 2));

                response.end(JSON.stringify(cart)); //Display the html with the products in the cart
                console.log("cart sent");
                break;
            case "/getProducts":    //If the action is /getProducts
                console.log("getProducts");
                response.writeHead(200, {
                    'Content-Type': 'text/html',
                    'Access-Control-Allow-Origin': '*'
                });
                var query = "SELECT * FROM products "; //Select all the products from the products table


                db.query(                              //Execute the above query
                    query,
                    [],
                    function(err, rows) {              //If there is an error, throw an error
                        if (err) throw err;
                        console.log(JSON.stringify(rows, null, 2));
                        response.end(JSON.stringify(rows)); //Display the html with the products available to buy
                        console.log("Products sent");
                    }
                );

                break;
            case '/' :
                var path;

                path = p.join(root, "/shop.html");

                console.log("serving " + path);
                var stream = fs.createReadStream(path);

                stream.on('data', function (chunk) {
                    response.write(chunk);
                });
                stream.on('end', function () {
                    response.end();
                });
                stream.on('error', function (err) {
                    response.end('');
                });
                break;
            default:


                var path = p.join(root, url1.pathname);
                console.log("serving " + path);
                var stream = fs.createReadStream(path);

                stream.on('data', function (chunk) {
                    response.write(chunk);
                });
                stream.on('end', function () {
                    response.end();
                });
                stream.on('error', function (err) {
                    response.statusCode = 500;
                    response.end('Internal Server Error');
                });

        }
    }



});


db.query(
    "CREATE TABLE products (" +
    "productID    INT UNSIGNED  NOT NULL AUTO_INCREMENT," +
    "name         VARCHAR(30)   NOT NULL DEFAULT ''," +
    "quantity     INT UNSIGNED  NOT NULL DEFAULT 0," +
    "price        DECIMAL(7,2)  NOT NULL DEFAULT 99999.99," +
    "image        VARCHAR(30)   NOT NULL DEFAULT ''," +
    "PRIMARY KEY  (productID))",
    function (err) {
        if (err == null) {
            // table created above so add some products into table
            console.log('table created. Add in some products');
            db.query(
                "INSERT INTO products (name, quantity, price, image) VALUES " +
                "('Car 1', 10000, 0.48,'car1.jpeg')," +
                "    ('Car 2', 8000, 0.49,'car2.jpeg')",
                function (err1) {
                    if (err1) throw err1;
                    console.log('Server started...');
                    server.listen(3000);
                });
        }
        else {
            if (err.code != 'ER_TABLE_EXISTS_ERROR') {
                throw err;
                console.log('error create table');
            }
            else
                console.log('table already created');
            console.log('Server started...');
            server.listen(3000);
        }

    }
);
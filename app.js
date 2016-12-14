var http = require('http'),
    fs = require('fs'),
    url = require('url');
var p = require('path');
var qs = require('querystring');
var mysql = require('mysql');
var root = __dirname;
var headers = [
    "Product Name", "Price", "Picture", "Buy Button"
];


var db = mysql.createConnection({
    host:     'localhost',
    user:     'root',
    password: 'root',
    database: 'shop'
});
var cart = [];
var theuser=null;
var theuserid =null;
var server = http.createServer(function (request, response) {
    var path = url.parse(request.url).pathname;
    var url1 = url.parse(request.url);
    if (request.method == 'POST') {
        switch (path) {
            case "/add":
                var body = '';
                console.log("add ");
                request.on('data', function (data) {
                    body += data;
                });

                request.on('end', function () {
                    var obj = qs.parse(body);
                    var id = parseInt(obj.prodid);
                    var quantity = parseInt(obj.qty);
                    console.log('addToCart id '+id)
                    var max =0;
                    var ind =0;
                    for (ind=0;ind<cart.length;ind++)
                        if (max < cart[ind].cartid)
                            max = cart[ind].cartid;
                    var cartid = max+1;
                    var query = "SELECT * FROM products where productID="+id;


                    db.query(
                        query,
                        [],
                        function(err, rows) {
                            if (err) {
                                response.end(JSON.stringify(cart));
                                throw err;
                            }
                            console.log(JSON.stringify(rows, null, 2));
                            response.end(JSON.stringify(rows));

                            var exist = false;
                            for (i = 0; i<cart.length; i++){
                                if (cart[i].productid  == rows[0].productID){
                                    cart[i].quantity++;
                                    exist = true;

                                    break;}
                            }
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
            case "/newProduct":
                var body = '';
                console.log("add ");
                request.on('data', function (data) {
                    body += data;
                });

                request.on('end', function () {
                    var product = qs.parse(body);

                    console.log('new Product');
                    console.log(JSON.stringify(product, null, 2));

                    var query = "INSERT INTO products (name, quantity, price)" +
                        " VALUES (?,?,?)";
                    var data = [product.name, product.quantity, product.price, product.image];
                    db.query(
                        query, data,
                        function (err) {
                            if (err) {
                                response.end("error");
                                throw err;
                            }
                            response.end("Product added successfully");

                        }
                    );
                });
                break;

            case "/delete":
                var body = '';
                console.log("delete ");
                request.on('data', function (data) {
                    body += data;
                });

                request.on('end', function () {
                    var post = qs.parse(body);
                    var cartid = parseInt(post['cnt']);

                    var index = 0;
                    for (index = 0; index < cart.length; index++)
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
            case "/userLogin":
                var body = '';
                console.log("user Login ");
                request.on('data', function (data) {
                    body += data;
                });

                request.on('end', function () {
                    var obj = qs.parse(body);
                    console.log(JSON.stringify(obj, null, 2));
                    var query = "SELECT * FROM Customer where name='"+obj.name+"'";
                    response.writeHead(200, {
                        'Access-Control-Allow-Origin': '*'
                    });

                    db.query(
                        query,
                        [],
                        function(err, rows) {
                            if (err) {
                                response.end("error");
                                throw err;
                            }
                            if (rows!=null && rows.length>0) {
                                console.log(" user in database");
                                response.end(" logged on as "+obj.name);
                                theuser = obj.name;
                                theuserid = rows[0].customerID;
                            }
                            else{
                                console.log(" user not in database");
                                response.end(" user not in database");
                            }

                        }
                    );


                });


                break;
            case "/checkout":
                var body = '';
                console.log("checkout ");
                request.on('data', function (data) {
                    body += data;
                });

                request.on('end', function () {
                    var obj = qs.parse(body);
                    console.log(JSON.stringify(obj, null, 2));
                    response.writeHead(200, {
                        'Access-Control-Allow-Origin': '*'
                    });
                    var ret = {error:1,
                        message: "please logon"};
                    if (theuserid==null) {
                        response.end("please logon");//JSON.stringify(ret));
                        return;
                    }
                    var query = "INSERT INTO Orders (customerID, saledate) "+
                        "VALUES (?, ?)";
                    var d = new Date();
                    var data = [theuserid,""+d];
                    db.query(
                        query,
                        data,
                        function(err, result) {
                            if (err) {
                                console.log("error in insert");
                                ret.message = "error in database";
                                response.end(JSON.stringify(ret));
                                throw err;
                            }
                            theuser = obj.name;
                            console.log("orders added");
                            var index =0;
                            data =[];
                            query = "INSERT INTO OrderDetails (orderID, productID, quantity)"+
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
                            db.query(
                                query,
                                data,
                                function(err, result) {
                                    if (err) {
                                        response.end("error");
                                        throw err;
                                    }
                                    console.log("orderdetails added");
                                    ret.message = "order added";
                                    ret.error =0;
                                    response.end("order added");//JSON.stringify(ret));

                                }
                            );


                        }
                    );


                });


                break;
            case "/userRegister":
                var body = '';
                console.log("user Register ");
                request.on('data', function (data) {
                    body += data;
                });

                request.on('end', function () {
                    var obj = qs.parse(body);
                    console.log(JSON.stringify(obj, null, 2));
                    var query = "SELECT * FROM Customer where name='"+obj.name+"'";
                    response.writeHead(200, {
                        'Access-Control-Allow-Origin': '*'
                    });

                    db.query(
                        query,
                        [],
                        function(err, rows) {
                            if (err) {
                                response.end("error");
                                throw err;
                            }
                            if (rows!=null && rows.length>0) {
                                console.log(" user already in database");
                                response.end(" User "+obj.name+ " already in database");
                            }
                            else{
                                query = "INSERT INTO Customer (name, password, address)"+
                                        "VALUES(?, ?, ?)";
                                db.query(
                                    query,
                                    [obj.name,obj.password,obj.address],
                                    function(err, result) {
                                        if (err) {
                                            response.end("error");
                                            throw err;
                                        }
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

            case "/getCart":
                console.log("getCart");
                response.writeHead(200, {
                    'Content-Type': 'text/html',
                    'Access-Control-Allow-Origin': '*'
                });

                console.log(JSON.stringify(cart, null, 2));

                response.end(JSON.stringify(cart));
                console.log("cart sent");
                break;
            case "/getProducts"    :
                console.log("getProducts");
                response.writeHead(200, {
                    'Content-Type': 'text/html',
                    'Access-Control-Allow-Origin': '*'
                });
                var query = "SELECT * FROM products ";


                db.query(
                    query,
                    [],
                    function(err, rows) {
                        if (err) throw err;
                        console.log(JSON.stringify(rows, null, 2));
                        response.end(JSON.stringify(rows));
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
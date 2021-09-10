const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /dishes handlers needed to make the tests pass

//Function to create a new dish when the customer sends a post request to the /dishes route.
function validateCreateBody(req, res, next) {
    const { data: { id, name, description, image_url, price } = {} } = req.body;
    const { dishId } = req.params

    //Verifying the name property exists and is not an empty string.  If either of those conditions exist an error message is sent to the user.
    if (!name || name === "") {
        next({
            status: 400,
            message: "Dish must include a name"
        })
    }
    //Verifying the description property exists and is not an empty string.  If either of those conditions exist an error message is sent to the user.
    if (!description || description === "") {
        next({
            status: 400,
            message: "Dish must include a description"
        })
    }
    //Verifying the image_url property exists and is not an empty string.  If either of those conditions exist an error message is sent to the user.
    if (!image_url || image_url === "") {
        next({
            status: 400,
            message: "Dish must include a image_url"
        })
    }
    //Verifying that the price property is included
    if (!price) {
        next({
            status: 400,
            message: "Dish must include a price"
        })
    }
    //Verifying that the price property is not less than or equal to 0, and that the price is not a number.  If either of those conditions exist an error message is sent to the user.
    if (price <= 0 || typeof (price) !== "number") {
        next({
            status: 400,
            message: "Dish must have a price that is an integer greater than 0"
        })
    }
    //Verifying that there is a dishId url param, the dish has an id, and the dishId url param matches the dish id.  If any of those conditions are not true the user is sent an error message.
    if (dishId && id && dishId !== id) {
        next({
            status: 400,
            message: `id ${dishId} does not match ${id}`
        })
    }
    next()
}

//Function to create a new dish when a post request is sent to /dishes.
function create(req, res) {
    const { data: { name, description, image_url, price } = {} } = req.body;

    //Creating an object that includes all of the request body properties as well as an id property created using the "nextId" utility function.
    const newDishData = {
        id: nextId(),
        name,
        description,
        image_url,
        price,
    };

    //Adding the new dish to the dishes database.
    dishes.push(newDishData);
    res.status(201).json({ data: newDishData });
}

//Function to make sure the dish exists when the customer sends a read or update requst to the /dishes/:dishId route.
function dishExists(req, res, next) {
    const { dishId } = req.params;
    const foundDish = dishes.find(dish => dish.id === dishId);
    if (foundDish) {
        //If the dish is found store it in locals.
        res.locals.dish = foundDish;
        next();
    }
    next({
        status: 404,
        message: `Dish does not exist: ${dishId}.`
    })
}

//Function to return the information for a particular dish when the user sends a get request to a /dishes/:dishId route.
function read(req, res) {
    res.json({ data: res.locals.dish });
}

//Function to update a dish when the user sends a put request to a /dishes/:dishId route.
function update(req, res) {
    //Using the dish information stored in locals from the dishExists function.
    const dish = res.locals.dish;
    const { data: { name, description, image_url, price } = {} } = req.body

    //Checking to see if the properties in the request body match the found order properties in the dishExists function.  If all of the properties match no change is made.  If any of the properties are different the dish is updated with the changed data.
    if (dish.name !== name || dish.description !== description || dish.image_url !== image_url || dish.price !== price) {
        dish.name = name;
        dish.description = description;
        dish.image_url = image_url;
        dish.price = price;
    }
    res.json({ data: dish })
}

//Function to send all of the dishes information to the user if they send a get request to the /dishes route.
function list(req, res) {
    res.json({ data: dishes })
}

module.exports = {
    create: [validateCreateBody, create],
    read: [dishExists, read],
    update: [dishExists, validateCreateBody, update],
    list: [list],
}
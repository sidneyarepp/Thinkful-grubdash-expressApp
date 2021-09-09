const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /dishes handlers needed to make the tests pass

function validateCreateBody(req, res, next) {
    const { data: { id, name, description, image_url, price } = {} } = req.body;
    const { dishId } = req.params

    if (!name || name === "") {
        next({
            status: 400,
            message: "Dish must include a name"
        })
    }
    if (!description || description === "") {
        next({
            status: 400,
            message: "Dish must include a description"
        })
    }
    if (!image_url || image_url === "") {
        next({
            status: 400,
            message: "Dish must include a image_url"
        })
    }
    if (!price) {
        next({
            status: 400,
            message: "Dish must include a price"
        })
    }
    if (price <= 0 || typeof (price) !== "number") {
        next({
            status: 400,
            message: "Dish must have a price that is an integer greater than 0"
        })
    }
    if (dishId && id && dishId !== id) {
        next({
            status: 400,
            message: `id ${dishId} does not match ${id}`
        })
    }
    next()
}


function create(req, res, next) {
    const { data: { name, description, image_url, price } = {} } = req.body;
    const newDishData = {
        id: nextId(),
        name,
        description,
        image_url,
        price,
    };
    dishes.push(newDishData);
    res.status(201).json({ data: newDishData });
}

function dishExists(req, res, next) {
    const { dishId } = req.params;
    const foundDish = dishes.find(dish => dish.id === dishId);
    if (foundDish) {
        res.locals.dish = foundDish;
        next();
    }
    next({
        status: 404,
        message: `Dish does not exist: ${dishId}.`
    })
}

function read(req, res, next) {
    res.json({ data: res.locals.dish });
}


function update(req, res, next) {
    const dish = res.locals.dish;
    const { data: { name, description, image_url, price } = {} } = req.body
    if (dish.name !== name || dish.description !== description || dish.image_url !== image_url || dish.price !== price) {
        dish.name = name;
        dish.description = description;
        dish.image_url = image_url;
        dish.price = price;
    }
    res.json({ data: dish })
}


function list(req, res, next) {
    res.json({ data: dishes })
}

module.exports = {
    create: [validateCreateBody, create],
    read: [dishExists, read],
    update: [dishExists, validateCreateBody, update],
    list,
}